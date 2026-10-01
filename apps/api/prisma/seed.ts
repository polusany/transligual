import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password || password.length < 16) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 16 characters before running the seed.');
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { roles: true } });
  if (existing) {
    if (!existing.roles.some(role => role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN)) throw new Error('The bootstrap email belongs to a non-admin account. Refusing to promote it automatically.');
    if (process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === 'true') {
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { email }, data: { passwordHash, status: UserStatus.ACTIVE, emailVerifiedAt: new Date() } });
        const account = await tx.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
        await tx.accountToken.updateMany({ where: { userId: account.id, usedAt: null }, data: { usedAt: new Date() } });
      });
      console.log('Administrator credentials restored. Remove the bootstrap flags and password from the host settings now.');
    } else {
      console.log('Administrator already exists; credentials were not changed.');
    }
  } else {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        roles: [UserRole.SUPER_ADMIN],
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        profile: { create: { firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || 'Platform', lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME?.trim() || 'Administrator' } },
      },
    });
  }
  const courseCategory = await prisma.category.findUnique({ where: { slug: 'french-learning' }, select: { id: true } });
  if (!courseCategory) await prisma.category.create({ data: { name: 'French learning', slug: 'french-learning', description: 'Structured French courses for every stage of the learning journey.' } });
  const interpretationServices = [
    { name: 'Remote consecutive interpretation', description: 'A language professional supports a live online or phone conversation.', durationUnit: 'HOUR' },
    { name: 'On-site interpretation', description: 'An interpreter joins your appointment, meeting, or event in person.', durationUnit: 'HOUR' },
    { name: 'Event interpretation planning', description: 'Tell us about a longer event and we will help plan the right language support.', durationUnit: 'EVENT' },
  ];
  for (const service of interpretationServices) {
    const existingService = await prisma.interpretationService.findFirst({ where: { name: service.name }, select: { id: true } });
    if (!existingService) await prisma.interpretationService.create({ data: { ...service, isActive: true } });
  }
  console.log(`Bootstrap completed for ${email}. Keep the password private and remove the bootstrap variables after use.`);
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
