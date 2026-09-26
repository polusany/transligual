import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificateStatus, EnrollmentStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async issueIfEligible(studentId: string, courseId: string) {
    const [enrollment, course] = await Promise.all([
      this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } }, select: { status: true } }),
      this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, certificateEnabled: true } }),
    ]);
    if (!enrollment || enrollment.status !== EnrollmentStatus.COMPLETED || !course?.certificateEnabled) return null;
    const existing = await this.prisma.certificate.findFirst({ where: { studentId, courseId }, select: { id: true, certificateNumber: true, verificationCode: true } });
    if (existing) return existing;
    const code = randomBytes(12).toString('hex').toUpperCase();
    const certificateNumber = `TL-${new Date().getUTCFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const certificate = await tx.certificate.create({ data: { studentId, courseId, certificateNumber, verificationCode: code, status: CertificateStatus.ACTIVE } });
        await tx.certificateVerification.create({ data: { certificateId: certificate.id, verificationCode: code } });
        await tx.auditLog.create({ data: { actorUserId: studentId, action: 'certificate.issued', entityType: 'Certificate', entityId: certificate.id } });
        return { id: certificate.id, certificateNumber: certificate.certificateNumber, verificationCode: certificate.verificationCode };
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return this.prisma.certificate.findFirst({ where: { studentId, courseId }, select: { id: true, certificateNumber: true, verificationCode: true } });
      }
      throw error;
    }
  }

  listMine(studentId: string) {
    return this.prisma.certificate.findMany({ where: { studentId }, orderBy: { issuedAt: 'desc' }, select: { id: true, certificateNumber: true, verificationCode: true, issuedAt: true, status: true, course: { select: { title: true } } } });
  }

  async findMine(studentId: string, id: string) {
    const certificate = await this.prisma.certificate.findFirst({ where: { id, studentId }, select: { id: true, certificateNumber: true, verificationCode: true, issuedAt: true, status: true, course: { select: { title: true } }, student: { select: { profile: { select: { firstName: true, lastName: true, displayName: true } } } } } });
    if (!certificate) throw new NotFoundException('Certificate not found.');
    return certificate;
  }

  async verify(code: string) {
    const certificate = await this.prisma.certificate.findUnique({ where: { verificationCode: code.toUpperCase() }, select: { id: true, certificateNumber: true, verificationCode: true, issuedAt: true, status: true, course: { select: { title: true } } } });
    if (!certificate) return { valid: false };
    const now = new Date();
    await this.prisma.certificateVerification.upsert({ where: { verificationCode: certificate.verificationCode }, create: { certificateId: certificate.id, verificationCode: certificate.verificationCode, verifiedAt: now, lastCheckedAt: now }, update: { verifiedAt: now, lastCheckedAt: now } });
    return { valid: certificate.status === CertificateStatus.ACTIVE, certificateNumber: certificate.certificateNumber, courseTitle: certificate.course.title, issuedAt: certificate.issuedAt, status: certificate.status };
  }

  async revoke(id: string, actorId: string) {
    const certificate = await this.prisma.certificate.findUnique({ where: { id }, select: { id: true } });
    if (!certificate) throw new NotFoundException('Certificate not found.');
    const [, log] = await this.prisma.$transaction([
      this.prisma.certificate.update({ where: { id }, data: { status: CertificateStatus.REVOKED } }),
      this.prisma.auditLog.create({ data: { actorUserId: actorId, action: 'certificate.revoked', entityType: 'Certificate', entityId: id } }),
    ]);
    return { id, revoked: true, auditId: log.id };
  }
}
