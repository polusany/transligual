import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { AdminCertificatesController, CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({ imports: [AuthModule], controllers: [CertificatesController, AdminCertificatesController], providers: [CertificatesService, PrismaService], exports: [CertificatesService] })
export class CertificatesModule {}
