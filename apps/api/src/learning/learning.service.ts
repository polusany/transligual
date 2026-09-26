import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CertificatesService } from '../certificates/certificates.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService, private readonly certificates: CertificatesService) {}

  async getCourse(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { id: true, status: true } });
    if (!enrollment || (enrollment.status !== EnrollmentStatus.ACTIVE && enrollment.status !== EnrollmentStatus.COMPLETED)) throw new ForbiddenException('An active course enrollment is required to access these lessons.');
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        status: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            sortOrder: true,
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                lessonType: true,
                sortOrder: true,
                isPreview: true,
                durationMinutes: true,
                materials: {
                  select: {
                    id: true,
                    materialType: true,
                    downloadable: true,
                    streamingOnly: true,
                    file: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found.');
    const progress = await this.prisma.lessonProgress.findMany({ where: { enrollmentId: enrollment.id }, select: { lessonId: true, progressPercentage: true, lastPositionSeconds: true, completedAt: true } });
    return { enrollmentId: enrollment.id, course, progress: progress.map((item) => ({ ...item, progressPercentage: item.progressPercentage.toString() })) };
  }

  async updateProgress(studentId: string, lessonId: string, input: UpdateProgressDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, module: { select: { courseId: true } } } });
    if (!lesson) throw new NotFoundException('Lesson not found.');
    const courseId = lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { id: true, status: true } });
    if (!enrollment || (enrollment.status !== EnrollmentStatus.ACTIVE && enrollment.status !== EnrollmentStatus.COMPLETED)) throw new ForbiddenException('An active course enrollment is required to save progress.');

    const percent = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.lessonProgress.findUnique({ where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } }, select: { progressPercentage: true } });
      const progressPercentage = Math.max(existing ? Number(existing.progressPercentage) : 0, input.progressPercentage);
      const completedAt = progressPercentage >= 100 ? new Date() : null;
      await tx.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
        create: { enrollmentId: enrollment.id, lessonId, studentId, progressPercentage, lastPositionSeconds: input.lastPositionSeconds, completedAt },
        update: { progressPercentage, lastPositionSeconds: input.lastPositionSeconds, completedAt },
      });
      const [total, completed] = await Promise.all([
        tx.lesson.count({ where: { module: { courseId } } }),
        tx.lessonProgress.count({ where: { enrollmentId: enrollment.id, progressPercentage: { gte: 100 } } }),
      ]);
      const coursePercent = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;
      await tx.courseProgress.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: { studentId, courseId, progressPercentage: coursePercent, completedAt: coursePercent >= 100 ? new Date() : null },
        update: { progressPercentage: coursePercent, completedAt: coursePercent >= 100 ? new Date() : null },
      });
      if (total > 0 && completed >= total) await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: EnrollmentStatus.COMPLETED, completedAt: new Date() } });
      return coursePercent;
    });
    const certificate = percent >= 100 ? await this.certificates.issueIfEligible(studentId, courseId) : null;
    return { lessonId, progressPercentage: input.progressPercentage >= 100 ? 100 : input.progressPercentage, courseProgressPercentage: percent, certificate };
  }
}
