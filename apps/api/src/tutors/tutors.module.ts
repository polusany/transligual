import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';

@Module({ imports: [AuthModule], controllers: [TutorsController], providers: [TutorsService, PrismaService] })
export class TutorsModule {}
