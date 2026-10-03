import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Store = Prisma.TransactionClient;
export async function assertCourseChoice(store: Store, userId: string, courseId: string, paymentId?: string) {
  const [registration, course, active, pending] = await Promise.all([
    store.learnerRegistration.findUnique({ where: { userId }, select: { program: true } }),
    store.course.findUnique({ where: { id: courseId }, select: { program: true } }),
    store.enrollment.findFirst({ where: { studentId: userId, status: 'ACTIVE', courseId: { not: courseId } } }),
    store.payment.findFirst({ where: { userId, ...(paymentId ? { id: { not: paymentId } } : {}), status: { in: ['PENDING', 'PROCESSING'] }, items: { some: { itemType: 'COURSE', referenceId: { not: courseId } } } } }),
  ]);
  if (active || pending) throw new ConflictException('Finish your current course or resolve its pending checkout before starting another course.');
  if (course?.program && registration?.program !== course.program) throw new ConflictException('Register for this program before starting its courses.');
  const unfinishedAssessments = await store.assessment.count({ where: { isPublished: true, course: { enrollments: { some: { studentId: userId, status: 'COMPLETED', courseId: { not: courseId } } } }, attempts: { none: { studentId: userId, passed: true } } } });
  if (unfinishedAssessments) throw new ConflictException('Pass the remaining assessments in your completed course before starting another course.');
}
export async function assertProgramChange(store: Store, userId: string, previous: string) {
  const active = await store.enrollment.count({ where: { studentId: userId, status: 'ACTIVE' } });
  const pending = await store.payment.count({ where: { userId, status: { in: ['PENDING', 'PROCESSING'] }, items: { some: { itemType: 'COURSE' } } } });
  if (active || pending) throw new ConflictException('Finish your current course before registering for another program.');
  if (['beginner', 'intermediate', 'advanced'].includes(previous)) {
    const courses = await store.course.findMany({ where: { program: previous, status: 'PUBLISHED' }, select: { id: true, enrollments: { where: { studentId: userId, status: 'COMPLETED' }, select: { id: true } } } });
    if (!courses.length || courses.some(course => !course.enrollments.length)) throw new ConflictException('Complete all courses in your current 3-month program before registering for another program.');
    const outstanding = await store.assessment.count({ where: { courseId: { in: courses.map(course => course.id) }, isPublished: true, attempts: { none: { studentId: userId, passed: true } } } });
    if (outstanding) throw new ConflictException('Pass all assessments in your current program before registering for another program.');
  }
}
