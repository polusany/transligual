import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalApprovalStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AccountsQueryDto } from './accounts-query.dto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService, private readonly courses: CoursesService) {}

  async listAccounts(query: AccountsQueryDto) {
    const page = query.page ?? 1;
    const search = query.search?.trim();
    const where = { status: query.view === 'removed' ? UserStatus.DEACTIVATED : { not: UserStatus.DEACTIVATED }, ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { profile: { is: { OR: [{ firstName: { contains: search, mode: 'insensitive' as const } }, { lastName: { contains: search, mode: 'insensitive' as const } }, { displayName: { contains: search, mode: 'insensitive' as const } }] } } }] } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * 50, take: 50, select: { id: true, email: true, roles: true, status: true, createdAt: true, emailVerifiedAt: true, profile: { select: { firstName: true, lastName: true, displayName: true } } } }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize: 50 };
  }

  async removeAccount(id: string, actorId: string) {
    if (id === actorId) throw new ForbiddenException('You cannot remove your own account.');
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id }, select: { id: true, roles: true, status: true } });
      if (!user) throw new NotFoundException('Account not found.');
      if (user.roles.some(role => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN)) throw new ForbiddenException('Administrator accounts cannot be removed here.');
      if (user.status === UserStatus.DEACTIVATED) throw new ConflictException('This account has already been removed.');
      const changed = await tx.user.updateMany({ where: { id, status: { not: UserStatus.DEACTIVATED }, NOT: { roles: { hasSome: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } } }, data: { status: UserStatus.DEACTIVATED } });
      if (changed.count !== 1) throw new ConflictException('This account changed. Refresh the list and try again.');
      await tx.accountToken.updateMany({ where: { userId: id, usedAt: null }, data: { usedAt: new Date() } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: 'account.removed', entityType: 'User', entityId: id } });
      return { id, message: 'Account removed. Access is blocked; learning and payment records are preserved.' };
    });
  }

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
      this.prisma.user.count({ where: { status: { not: UserStatus.DEACTIVATED } } }), this.prisma.course.count(), this.prisma.tutorProfile.count({ where: { approvalStatus: ProfessionalApprovalStatus.PENDING_APPROVAL } }), this.prisma.payment.count(),
    ]);
    return { users, courses, pendingTutors: tutors, payments };
  }
}
