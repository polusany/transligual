import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { PrismaService } from '../prisma.service';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({ imports: [AuthModule, CertificatesModule], controllers: [LearningController], providers: [LearningService, PrismaService] })
export class LearningModule {}
