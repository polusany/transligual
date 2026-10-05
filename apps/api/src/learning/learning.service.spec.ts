import {LearningService} from './learning.service';
describe('learning access',()=>{
 it('rejects course access without enrollment',async()=>{const p={learnerRegistration:{findUnique:async()=>({userId:'u'})},enrollment:{findUnique:async()=>null}};await expect(new LearningService(p as any,{} as any).getCourse('student','course')).rejects.toThrow();});
 it('rejects completion until the quiz is passed',async()=>{const p={learnerRegistration:{findUnique:async()=>({userId:'u'})},lesson:{findUnique:async()=>({id:'l',module:{courseId:'c'},lessonType:'QUIZ'})},enrollment:{findUnique:async()=>({id:'e',status:'ACTIVE'})},assessment:{findUnique:async()=>({id:'a',isPublished:true})},assessmentAttempt:{findFirst:async()=>null},$transaction:jest.fn()};await expect(new LearningService(p as any,{} as any).updateProgress('u','l',{progressPercentage:100,lastPositionSeconds:0})).rejects.toThrow('Pass');expect(p.$transaction).not.toHaveBeenCalled();});
});

describe('course completion', () => {
  it('completes enrollment and issues a certificate after the final passed lesson', async () => {
    const tx = {
      lessonProgress: { findUnique: jest.fn().mockResolvedValue({ progressPercentage: 50 }), upsert: jest.fn(), count: jest.fn().mockResolvedValue(2) },
      lesson: { count: jest.fn().mockResolvedValue(2) },
      courseProgress: { upsert: jest.fn() },
      enrollment: { update: jest.fn() },
    };
    const prisma = {
      learnerRegistration: { findUnique: jest.fn().mockResolvedValue({ userId: 'u' }) },
      lesson: { findUnique: jest.fn().mockResolvedValue({ id: 'l', module: { courseId: 'c' }, lessonType: 'QUIZ' }) },
      enrollment: { findUnique: jest.fn().mockResolvedValue({ id: 'e', status: 'ACTIVE' }) },
      assessment: { findUnique: jest.fn().mockResolvedValue({ id: 'a', isPublished: true }) },
      assessmentAttempt: { findFirst: jest.fn().mockResolvedValue({ passed: true }) },
      $transaction: (callback: (store: typeof tx) => Promise<number>) => callback(tx),
    };
    const certificates = { issueIfEligible: jest.fn().mockResolvedValue({ id: 'certificate' }) };
    const result = await new LearningService(prisma as any, certificates as any).updateProgress('u', 'l', { progressPercentage: 100, lastPositionSeconds: 0 });
    expect(result.courseProgressPercentage).toBe(100);
    expect(tx.enrollment.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'e' }, data: expect.objectContaining({ status: 'COMPLETED' }) }));
    expect(certificates.issueIfEligible).toHaveBeenCalledWith('u', 'c');
  });
});
