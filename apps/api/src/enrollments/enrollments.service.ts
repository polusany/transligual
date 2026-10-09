import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CourseStatus, EnrollmentStatus, FileStatus, FileVisibility } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { LearnerRegistrationDto } from './learner-registration.dto';
import { assertCourseChoice, assertProgramChange } from './course-choice';
import { requireRegistration } from './require-registration';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistration(userId: string) {
    const [registration, profile] = await Promise.all([
      this.prisma.learnerRegistration.findUnique({ where: { userId } }),
      this.prisma.profile.findUnique({ where: { userId }, select: { avatarFileId: true } }),
    ]);
    return registration ? { ...registration, hasPassport: Boolean(profile?.avatarFileId) } : null;
  }
  async readPassport(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, include: { avatarFile: true } });
    const file = profile?.avatarFile;
    if (!file || file.ownerUserId !== userId || file.status !== FileStatus.READY || !/^passports\/[a-f0-9-]+\.(png|jpg)$/.test(file.objectKey)) throw new NotFoundException('No passport photo uploaded.');
    const root = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    const content = await readFile(join(root, file.objectKey)).catch(() => { throw new NotFoundException('Passport photo unavailable.'); });
    return { content, mimeType: file.mimeType };
  }
  async savePassport(userId: string, file?: { buffer: Buffer; mimetype: string; size: number }) {
    if (!file || !file.size || file.size > 5 * 1024 * 1024) throw new BadRequestException('Choose a passport photo up to 5 MB.');
    const png = file.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = file.mimetype === 'image/jpeg' && file.buffer[0] === 255 && file.buffer[1] === 216 && file.buffer[2] === 255;
    if (!png && !jpeg) throw new BadRequestException('Choose a PNG or JPEG passport photo.');
    const objectKey = `passports/${randomUUID()}.${png ? 'png' : 'jpg'}`;
    const root = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    const path = join(root, objectKey);
    await mkdir(join(root, 'passports'), { recursive: true });
    await writeFile(path, file.buffer, { flag: 'wx' });
    try {
      await this.prisma.$transaction(async tx => {
        const asset = await tx.file.create({ data: { ownerUserId: userId, originalName: 'Passport photo', objectKey, mimeType: file.mimetype, sizeBytes: BigInt(file.size), status: FileStatus.READY, visibility: FileVisibility.PRIVATE } });
        await tx.profile.update({ where: { userId }, data: { avatarFileId: asset.id } });
      });
    } catch (error) { await unlink(path).catch(() => undefined); throw error; }
    return { hasPassport: true };
  }
  async courseRecord(userId: string) {
    const [learner, courses, certificates, payments] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, profile: { select: { firstName: true, lastName: true, displayName: true } }, learnerRegistration: true } }),
      this.prisma.enrollment.findMany({ where: { studentId: userId }, orderBy: { enrolledAt: 'asc' }, select: { id: true, status: true, enrolledAt: true, completedAt: true, course: { select: { id: true, title: true, certificateEnabled: true } } } }),
      this.prisma.certificate.findMany({ where: { studentId: userId }, select: { courseId: true, certificateNumber: true, verificationCode: true, issuedAt: true, status: true } }),
      this.prisma.payment.findMany({ where: { userId, items: { some: { itemType: { in: ['COURSE', 'CERTIFICATION'] } } } }, orderBy: { createdAt: 'desc' }, select: { id: true, providerReference: true, amountMinor: true, currency: true, status: true, paidAt: true, createdAt: true, items: { select: { description: true, itemType: true, referenceId: true, amountMinor: true } } } }),
    ]);
    const records = await Promise.all(courses.map(async enrollment => {
      const outstandingAssessments = enrollment.course.certificateEnabled && enrollment.status === EnrollmentStatus.COMPLETED
        ? await this.prisma.assessment.count({ where: { courseId: enrollment.course.id, isPublished: true, attempts: { none: { studentId: userId, passed: true } } } }) : null;
      const certificate = certificates.find(item => item.courseId === enrollment.course.id);
      const eligibility = !enrollment.course.certificateEnabled ? 'NOT_OFFERED'
        : certificate?.status === 'REVOKED' ? 'REVOKED'
        : enrollment.status !== EnrollmentStatus.COMPLETED ? 'INCOMPLETE'
        : outstandingAssessments ? 'ASSESSMENTS_PENDING' : 'ELIGIBLE';
      return { ...enrollment, eligibility, certificate: certificate ?? null };
    }));
    return { generatedAt: new Date(), learner, courses: records, transactions: payments.map(payment => ({ ...payment, amountMinor: payment.amountMinor.toString(), items: payment.items.map(item => ({ ...item, amountMinor: item.amountMinor.toString() })) })) };
  }
  async saveRegistration(userId: string, input: LearnerRegistrationDto) {
    const data = { fullName: input.fullName, phone: input.phone, program: input.program, frenchLevel: input.frenchLevel, goals: input.goals };
    return this.prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId + ':course-choice'}))`;
      const existing = await tx.learnerRegistration.findUnique({ where: { userId } });
      if (existing && existing.program !== input.program) await assertProgramChange(tx, userId, existing.program);
      return tx.learnerRegistration.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    });
  }
  async listMine(studentId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] } },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true, status: true, enrolledAt: true, completedAt: true,
        course: { select: { id: true, slug: true, title: true, shortDescription: true, program: true, level: true } },
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
    await requireRegistration(this.prisma, studentId);
    return this.prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId + ':course-choice'}))`;
    const course = await tx.course.findUnique({ where: { id: courseId }, select: { id: true, status: true, priceMinor: true } });
    if (!course || course.status !== CourseStatus.PUBLISHED) throw new NotFoundException('Course not found.');
    if (course.priceMinor > 0n) throw new ConflictException('Checkout is not available for this course yet.');
    const existing = await tx.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
    if (existing && (existing.status === EnrollmentStatus.ACTIVE || existing.status === EnrollmentStatus.COMPLETED)) return existing;
    await assertCourseChoice(tx, studentId, courseId);
    if (existing) return tx.enrollment.update({ where: { id: existing.id }, data: { status: EnrollmentStatus.ACTIVE, enrolledAt: new Date(), completedAt: null } });
    return tx.enrollment.create({ data: { studentId, courseId, status: EnrollmentStatus.ACTIVE } });
    });
  }
}
