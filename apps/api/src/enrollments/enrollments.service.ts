import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] } },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true, status: true, enrolledAt: true, completedAt: true,
        course: { select: { id: true, slug: true, title: true, shortDescription: true, level: true } },
      },
    });
    const progress = await this.prisma.courseProgress.findMany({
      where: { studentId, courseId: { in: enrollments.map((enrollment) => enrollment.course.id) } },
      select: { courseId: true, progressPercentage: true, completedAt: true },
    });
    const byCourse = new Map(progress.map((item) => [item.courseId, { progressPercentage: item.progressPercentage.toString(), completedAt: item.completedAt }]));
    return enrollments.map((enrollment) => ({ ...enrollment, courseProgress: byCourse.get(enrollment.course.id) ?? null }));
  }

  async enrollFreeCourse(studentId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, status: true, priceMinor: true } });
    if (!course || course.status !== CourseStatus.PUBLISHED) throw new NotFoundException('Course not found.');
    if (course.priceMinor > 0n) throw new ConflictException('Checkout is not available for this course yet.');
    const existing = await this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
    if (existing && (existing.status === EnrollmentStatus.ACTIVE || existing.status === EnrollmentStatus.COMPLETED)) return existing;
    if (existing) return this.prisma.enrollment.update({ where: { id: existing.id }, data: { status: EnrollmentStatus.ACTIVE, enrolledAt: new Date(), completedAt: null } });
    return this.prisma.enrollment.create({ data: { studentId, courseId, status: EnrollmentStatus.ACTIVE } });
  }
}
