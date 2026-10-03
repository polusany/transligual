import { validate } from 'class-validator';
import { AssignProgramDto } from './dto/assign-program.dto';
import { CoursesService } from './courses.service';
describe('course program assignment', () => {
  it.each(['beginner', 'intermediate', 'advanced', ''])('accepts program %s', async program => {
    expect(await validate(Object.assign(new AssignProgramDto(), { program }))).toHaveLength(0);
  });
  it('rejects unknown programs', async () => {
    expect((await validate(Object.assign(new AssignProgramDto(), { program: 'unknown' }))).length).toBeGreaterThan(0);
  });
  it('assigns a published existing course without changing its curriculum or publication', async () => {
    const prisma = { course: { findUnique: jest.fn().mockResolvedValue({ id: 'c' }), update: jest.fn().mockResolvedValue({ id: 'c', priceMinor: 0n, program: 'advanced' }) } };
    const service = new CoursesService(prisma as any);
    await service.assignProgram('c', 'advanced');
    expect(prisma.course.update).toHaveBeenCalledWith({ where: { id: 'c' }, data: { program: 'advanced' } });
    await service.assignProgram('c', '');
    expect(prisma.course.update).toHaveBeenLastCalledWith({ where: { id: 'c' }, data: { program: null } });
    prisma.course.findUnique.mockResolvedValue(null as any);
    await expect(service.assignProgram('missing', 'beginner')).rejects.toThrow('Course not found');
  });
});
