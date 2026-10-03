import { assertCourseChoice, assertProgramChange } from './course-choice';
describe('one course at a time', () => {
  function store() {
    return { learnerRegistration: { findUnique: jest.fn().mockResolvedValue({ program: 'beginner' }) }, course: { findUnique: jest.fn().mockResolvedValue({ program: 'beginner' }), findMany: jest.fn().mockResolvedValue([{ id: 'c', enrollments: [{ id: 'e' }] }]) }, enrollment: { findFirst: jest.fn().mockResolvedValue(null), count: jest.fn().mockResolvedValue(0) }, payment: { findFirst: jest.fn().mockResolvedValue(null), count: jest.fn().mockResolvedValue(0) }, assessment: { count: jest.fn().mockResolvedValue(0) } };
  }
  it('blocks another enrollment while a course is active', async () => { const tx = store(); tx.enrollment.findFirst.mockResolvedValue({ id: 'active' } as any); await expect(assertCourseChoice(tx as any, 'u', 'next')).rejects.toThrow('Finish your current course'); });
  it('blocks another checkout while payment is pending', async () => { const tx = store(); tx.payment.findFirst.mockResolvedValue({ id: 'pending' } as any); await expect(assertCourseChoice(tx as any, 'u', 'next')).rejects.toThrow('pending checkout'); });
  it('blocks courses outside the registered program', async () => { const tx = store(); tx.course.findUnique.mockResolvedValue({ program: 'advanced' }); await expect(assertCourseChoice(tx as any, 'u', 'next')).rejects.toThrow('Register for this program'); });
  it('requires outstanding assessments before another course', async () => { const tx = store(); tx.assessment.count.mockResolvedValue(1); await expect(assertCourseChoice(tx as any, 'u', 'next')).rejects.toThrow('remaining assessments'); });
  it('allows the next course after completion', async () => { await expect(assertCourseChoice(store() as any, 'u', 'next')).resolves.toBeUndefined(); });
  it('does not permit switching an unstarted program', async () => { const tx = store(); tx.course.findMany.mockResolvedValue([]); await expect(assertProgramChange(tx as any, 'u', 'beginner')).rejects.toThrow('Complete all courses'); });
  it('blocks a program with unfinished courses', async () => { const tx = store(); tx.course.findMany.mockResolvedValue([{ id: 'c', enrollments: [] }]); await expect(assertProgramChange(tx as any, 'u', 'beginner')).rejects.toThrow('Complete all courses'); });
  it('allows registering another program after all courses and assessments', async () => { await expect(assertProgramChange(store() as any, 'u', 'beginner')).resolves.toBeUndefined(); });
});
