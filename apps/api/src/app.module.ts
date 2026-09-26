import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { AdminModule } from './admin/admin.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { TranslationsModule } from './translations/translations.module';
import { InterpretationModule } from './interpretation/interpretation.module';
import { PaymentsModule } from './payments/payments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { LearningModule } from './learning/learning.module';
import { TutorsModule } from './tutors/tutors.module';
import { HealthController } from './health/health.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    TutorsModule,
    AdminModule,
    TranslationsModule,
    InterpretationModule,
    PaymentsModule,
    CertificatesModule,
    LearningModule,
  ],

  controllers: [
    HealthController,
  ],

  providers: [
    PrismaService,
  ],
})
export class AppModule {}
