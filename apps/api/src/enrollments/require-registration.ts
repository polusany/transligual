import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export async function requireRegistration(prisma: PrismaService, userId: string) {
  if (!await prisma.learnerRegistration.findUnique({ where: { userId }, select: { userId: true } })) {
    throw new ForbiddenException('Complete your learner registration form before starting a course.');
  }
}
