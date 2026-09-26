import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CurriculumController } from './curriculum.controller';
import { CourseFilesController } from './files.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [CoursesController, CurriculumController, CourseFilesController],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}
