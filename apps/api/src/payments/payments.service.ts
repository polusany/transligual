import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, PaymentStatus, PaymentItemType, EnrollmentStatus } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma.service';

type PaystackResponse<T> = { status: boolean; message?: string; data: T };
type PaystackTransaction = { reference: string; status: string; amount: number | string; currency: string; customer?: { email?: string } };

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private get secretKey() {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) throw new ServiceUnavailableException('Checkout is not configured yet.');
    return key;
  }

  async initializeCourseCheckout(userId: string, courseId: string) {
    const secretKey = this.secretKey;
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, status: true } }),
      this.prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, priceMinor: true, currency: true, status: true } }),
    ]);
    if (!user || user.status !== 'ACTIVE') throw new ConflictException('An active account is required to check out.');
    if (!course || course.status !== 'PUBLISHED') throw new ConflictException('This course is not available for purchase.');
    if (course.priceMinor <= 0n) throw new ConflictException('This course is free; use free enrollment instead.');

    const alreadyEnrolled = await this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: userId, courseId } }, select: { status: true } });
    if (alreadyEnrolled && (alreadyEnrolled.status === EnrollmentStatus.ACTIVE || alreadyEnrolled.status === EnrollmentStatus.COMPLETED)) throw new ConflictException('You already have access to this course.');

    const reference = `TL-${randomUUID().replaceAll('-', '')}`;
    const callbackUrl = this.config.get<string>('PAYSTACK_CALLBACK_URL') ?? `${this.config.get<string>('APP_URL') ?? 'http://localhost:3000'}/payments/return`;
    const payment = await this.prisma.payment.create({
      data: {
        userId, provider: PaymentProvider.PAYSTACK, providerReference: reference,
        amountMinor: course.priceMinor, currency: course.currency.toUpperCase(), status: PaymentStatus.PENDING,
        items: { create: { itemType: PaymentItemType.COURSE, referenceId: course.id, description: course.title, amountMinor: course.priceMinor } },
      },
    });

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount: course.priceMinor.toString(), currency: course.currency.toUpperCase(), reference, callback_url: callbackUrl, metadata: { paymentId: payment.id, courseId: course.id } }),
      });
      const result = await response.json() as PaystackResponse<{ authorization_url: string; reference: string }>;
      if (!response.ok || !result.status || !result.data?.authorization_url || result.data.reference !== reference) throw new Error('Payment initialization was rejected.');
      return { paymentId: payment.id, reference, authorizationUrl: result.data.authorization_url };
    } catch {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      throw new ServiceUnavailableException('We could not start checkout. Please try again later.');
    }
  }

  async verifyCoursePayment(userId: string, reference: string) {
    const payment = await this.prisma.payment.findUnique({ where: { providerReference: reference }, select: { userId: true, provider: true } });
    if (!payment || payment.userId !== userId || payment.provider !== PaymentProvider.PAYSTACK) throw new ConflictException('Payment reference not found for this account.');
    return this.verifyAndFulfil(reference, payment.userId);
  }

  async verifyAndFulfil(reference: string, expectedUserId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { providerReference: reference }, include: { items: true } });
    if (!payment || payment.provider !== PaymentProvider.PAYSTACK || (expectedUserId && payment.userId !== expectedUserId)) throw new ConflictException('Payment reference is invalid.');
    const item = payment.items.find((candidate) => candidate.itemType === PaymentItemType.COURSE);
    if (!item) throw new ConflictException('This payment does not contain a course enrollment.');
    if (payment.status === PaymentStatus.SUCCESSFUL) {
      const enrollment = await this.prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: payment.userId, courseId: item.referenceId } } });
      return { status: payment.status, enrollmentId: enrollment?.id ?? null };
    }

    const result = await this.requestPaystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
    const verifiedAmount = BigInt(String(result.amount));
    if (result.reference !== reference || result.currency.toUpperCase() !== payment.currency.toUpperCase() || verifiedAmount !== payment.amountMinor) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      throw new ConflictException('The verified payment does not match the expected amount or currency.');
    }
    if (result.status !== 'success') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
      return { status: PaymentStatus.FAILED, enrollmentId: null };
    }

    const enrollment = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.SUCCESSFUL, paidAt: new Date() } });
      const created = await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId: payment.userId, courseId: item.referenceId } },
        create: { studentId: payment.userId, courseId: item.referenceId, paymentId: payment.id, status: EnrollmentStatus.ACTIVE },
        update: { paymentId: payment.id, status: EnrollmentStatus.ACTIVE, enrolledAt: new Date(), completedAt: null },
      });
      await tx.auditLog.create({ data: { actorUserId: payment.userId, action: 'payment.verified', entityType: 'Payment', entityId: payment.id, metadata: { provider: 'PAYSTACK', reference } } });
      return created;
    });
    return { status: PaymentStatus.SUCCESSFUL, enrollmentId: enrollment.id };
  }

  listMine(userId: string) {
    return this.prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, provider: true, providerReference: true, amountMinor: true, currency: true, status: true, paidAt: true, createdAt: true, items: { select: { description: true, itemType: true, amountMinor: true } } } });
  }

  verifyWebhookSignature(signature: string | undefined, rawBody: Buffer | undefined) {
    const secret = this.config.get<string>('PAYSTACK_WEBHOOK_SECRET') ?? this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret || !signature || !rawBody) return false;
    const supplied = Buffer.from(signature, 'hex');
    const expected = createHmac('sha512', secret).update(rawBody).digest();
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  }

  async handleWebhook(event: { event?: string; data?: { reference?: string } }) {
    if (event.event !== 'charge.success' || !event.data?.reference) return { received: true };
    await this.verifyAndFulfil(event.data.reference);
    return { received: true };
  }

  private async requestPaystack<T>(path: string) {
    let response: Response;
    try { response = await fetch(`https://api.paystack.co${path}`, { method: 'GET', headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' } }); }
    catch { throw new ServiceUnavailableException('Payment verification is temporarily unavailable.'); }
    const result = await response.json() as PaystackResponse<T>;
    if (!response.ok || !result.status || !result.data) throw new ServiceUnavailableException('The payment provider could not verify this transaction.');
    return result.data;
  }
}
