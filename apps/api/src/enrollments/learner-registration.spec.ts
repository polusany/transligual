import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LearnerRegistrationDto } from './learner-registration.dto';
import { EnrollmentsService } from './enrollments.service';
import { LearningService } from '../learning/learning.service';
import { PaymentsService } from '../payments/payments.service';

describe('learner registration', () => {
  const input = { fullName: ' Learner Name ', phone: '+234 800 000 0000', program: 'beginner', frenchLevel: 'none', goals: 'I want to speak French confidently.' };
  it('validates and trims learner details', async () => {
    const dto = plainToInstance(LearnerRegistrationDto, input);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.fullName).toBe('Learner Name');
  });
  it.each([{ fullName: ' ' }, { phone: 'invalid' }, { program: 'unknown' }, { frenchLevel: '' }, { goals: ' ' }])('rejects incomplete or invalid details %j', async invalid => {
    expect((await validate(plainToInstance(LearnerRegistrationDto, { ...input, ...invalid }))).length).toBeGreaterThan(0);
  });
  it('saves against the authenticated user and never a supplied user id', async () => {
    const prisma = { learnerRegistration: { upsert: jest.fn() } };
    await new EnrollmentsService(prisma as any).saveRegistration('owner', { ...input, userId: 'other' } as any);
    expect(prisma.learnerRegistration.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' }, create: expect.objectContaining({ userId: 'owner' }) }));
    expect(prisma.learnerRegistration.upsert.mock.calls[0][0].update).not.toHaveProperty('userId');
  });
  it('blocks enrollment, checkout, lesson access, and progress before registration', async () => {
    const prisma = { learnerRegistration: { findUnique: jest.fn().mockResolvedValue(null) }, course: { findUnique: jest.fn() } };
    await expect(new EnrollmentsService(prisma as any).enrollFreeCourse('u', 'c')).rejects.toThrow('registration');
    await expect(new PaymentsService(prisma as any, {} as any).initializeCourseCheckout('u', 'c')).rejects.toThrow('registration');
    const learning = new LearningService(prisma as any, {} as any);
    await expect(learning.getCourse('u', 'c')).rejects.toThrow('registration');
    await expect(learning.updateProgress('u', 'l', { progressPercentage: 100, lastPositionSeconds: 0 })).rejects.toThrow('registration');
    expect(prisma.course.findUnique).not.toHaveBeenCalled();
  });
  it('allows a registered learner to enroll but still requires an available course', async () => {
    const prisma = { learnerRegistration: { findUnique: jest.fn().mockResolvedValue({ userId: 'u' }) }, course: { findUnique: jest.fn().mockResolvedValue({ id: 'c', status: 'PUBLISHED', priceMinor: 0n }) }, enrollment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'e' }) } };
    expect(await new EnrollmentsService(prisma as any).enrollFreeCourse('u', 'c')).toEqual({ id: 'e' });
    prisma.course.findUnique.mockResolvedValue(null as any);
    await expect(new EnrollmentsService(prisma as any).enrollFreeCourse('u', 'missing')).rejects.toThrow('Course not found');
  });
});
