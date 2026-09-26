import { BadRequestException, Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CoursesService } from './courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { CreateModuleDto } from './dto/create-module.dto';

const UPLOAD_ROOT = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const UPLOAD_TEMP = join(UPLOAD_ROOT, '.tmp');
const ALLOWED_UPLOADS: Record<string, string> = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
};

const lessonFileInterceptor = FileInterceptor('file', {
  dest: UPLOAD_TEMP,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (request, file, callback) => {
    try { mkdirSync(UPLOAD_TEMP, { recursive: true }); }
    catch (error) { callback(error as Error, false); return; }
    const expectedMimeType = ALLOWED_UPLOADS[extname(file.originalname).toLowerCase()];
    if (!expectedMimeType || expectedMimeType !== file.mimetype) {
      callback(new BadRequestException('Choose an MP4/WebM video, MP3/WAV/OGG audio, PDF, PNG, or JPEG file.'), false);
      return;
    }
    (request as CourseMaterialRequest).courseMaterialOriginalName = file.originalname;
    file.originalname = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    callback(null, true);
  },
});

type UploadedLessonFile = { path: string; originalname: string; mimetype: string; size: number };
type CourseMaterialRequest = AuthenticatedRequest & { courseMaterialOriginalName?: string };

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TUTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class CurriculumController {
  constructor(private readonly courses: CoursesService) {}

  @Get('courses/:courseId/curriculum')
  getCourse(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) {
    return this.courses.getEditableCourse(courseId, request.user.sub, request.user.roles);
  }

  @Post('courses/:courseId/modules')
  createModule(@Param('courseId') courseId: string, @Body() body: CreateModuleDto, @Req() request: AuthenticatedRequest) {
    return this.courses.createModule(courseId, request.user.sub, request.user.roles, body);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(@Param('moduleId') moduleId: string, @Body() body: CreateLessonDto, @Req() request: AuthenticatedRequest) {
    return this.courses.createLesson(moduleId, request.user.sub, request.user.roles, body);
  }

  @Post('lessons/:lessonId/materials')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(lessonFileInterceptor)
  uploadMaterial(@Param('lessonId') lessonId: string, @UploadedFile() file: UploadedLessonFile | undefined, @Req() request: CourseMaterialRequest) {
    if (!file) throw new BadRequestException('Choose a course file to upload.');
    file.originalname = request.courseMaterialOriginalName ?? file.originalname;
    return this.courses.addLessonMaterial(lessonId, request.user.sub, request.user.roles, file);
  }
}
