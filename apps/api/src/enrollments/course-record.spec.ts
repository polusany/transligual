import { EnrollmentsService } from './enrollments.service';

describe('learner course record', () => {
  it('requires passing assessments and does not treat revoked certificates as eligible', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ email: 'learner@example.com' }) },
      enrollment: { findMany: jest.fn().mockResolvedValue([
        { status: 'COMPLETED', course: { id: 'pending', certificateEnabled: true } },
        { status: 'COMPLETED', course: { id: 'ready', certificateEnabled: true } },
        { status: 'COMPLETED', course: { id: 'revoked', certificateEnabled: true } },
        { status: 'ACTIVE', course: { id: 'active', certificateEnabled: true } },
      ]) },
      certificate: { findMany: jest.fn().mockResolvedValue([{ courseId: 'revoked', status: 'REVOKED' }]) },
      payment: { findMany: jest.fn().mockResolvedValue([{ amountMinor: 10000n, items: [{ itemType: 'CERTIFICATION', amountMinor: 10000n }] }]) },
      assessment: { count: jest.fn().mockImplementation(({ where }) => Promise.resolve(where.courseId === 'pending' ? 1 : 0)) },
    };
    const result = await new EnrollmentsService(prisma as any).courseRecord('owner');
    expect(result.courses.map(item => item.eligibility)).toEqual(['ASSESSMENTS_PENDING', 'ELIGIBLE', 'REVOKED', 'INCOMPLETE']);
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { studentId: 'owner' } }));
    expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner', items: { some: { itemType: { in: ['COURSE', 'CERTIFICATION'] } } } } }));
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(result.transactions[0].items[0].amountMinor).toBe('10000');
  });
});
