import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalApprovalStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { TutorApplicationDto } from './dto/tutor-application.dto';

@Injectable()
export class TutorsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, input: TutorApplicationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true, tutorProfile: { select: { id: true } } } });
    if (!user) throw new NotFoundException('Account not found.');
    if (user.tutorProfile) throw new ConflictException('A tutor application already exists for this account.');
    const roles = user.roles.includes(UserRole.TUTOR) ? user.roles : [...user.roles, UserRole.TUTOR];
    const [, profile] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { roles } }),
      this.prisma.tutorProfile.create({ data: { userId, headline: input.headline.trim(), biography: input.biography.trim(), qualifications: input.qualifications?.trim() || null, yearsExperience: input.yearsExperience ?? null, languages: input.languages.map((language) => language.trim()).filter(Boolean), approvalStatus: ProfessionalApprovalStatus.PENDING_APPROVAL } }),
    ]);
    return { id: profile.id, approvalStatus: profile.approvalStatus, createdAt: profile.createdAt };
  }
}
