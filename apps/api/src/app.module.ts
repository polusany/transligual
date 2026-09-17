import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { HealthController } from './health/health.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,
    CoursesModule,
  ],

  controllers: [
    HealthController,
  ],

  providers: [
    PrismaService,
  ],
})
export class AppModule {}