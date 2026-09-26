import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalApprovalStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly courses: CoursesService) {}

  listCoursesForReview() { return this.courses.listForReview(); }
  publishCourse(courseId: string, actorId: string) { return this.courses.publish(courseId, actorId); }

  listPendingTutors() {
    return this.prisma.tutorProfile.findMany({
      where: { approvalStatus: ProfessionalApprovalStatus.PENDING_APPROVAL },
      orderBy: { createdAt: 'asc' },
      select: { id: true, headline: true, biography: true, qualifications: true, yearsExperience: true, languages: true, createdAt: true, user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async decideTutor(profileId: string, approved: boolean, actorId: string) {
    const profile = await this.prisma.tutorProfile.findUnique({ where: { id: profileId }, select: { id: true, userId: true, approvalStatus: true } });
    if (!profile) throw new NotFoundException('Tutor application not found.');
    const approvalStatus = approved ? ProfessionalApprovalStatus.APPROVED : ProfessionalApprovalStatus.REJECTED;
    const [, updated] = await this.prisma.$transaction([
      this.prisma.tutorProfile.update({ where: { id: profile.id }, data: { approvalStatus } }),
      this.prisma.auditLog.create({ data: { actorUserId: actorId, action: approved ? 'tutor.approved' : 'tutor.rejected', entityType: 'TutorProfile', entityId: profile.id } }),
    ]);
    return { id: profile.id, approvalStatus, userId: profile.userId, auditId: updated.id };
  }

  async dashboard() {
    const [users, courses, tutors, payments] = await Promise.all([
      this.prisma.user.count(), this.prisma.course.count(), this.prisma.tutorProfile.count({ where: { approvalStatus: ProfessionalApprovalStatus.PENDING_APPROVAL } }), this.prisma.payment.count(),
    ]);
    return { users, courses, pendingTutors: tutors, payments };
  }
}
