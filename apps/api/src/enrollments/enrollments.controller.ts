import { Body, Controller, Get, Param, Post, Req, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LearnerRegistrationDto } from './learner-registration.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EnrollmentsService } from './enrollments.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get('learner-registration/me')
  registration(@Req() request: AuthenticatedRequest) {
    return this.enrollments.getRegistration(request.user.sub);
  }

  @Post('learner-registration/me')
  saveRegistration(@Req() request: AuthenticatedRequest, @Body() input: LearnerRegistrationDto) {
    return this.enrollments.saveRegistration(request.user.sub, input);
  }

  @Get('learner-registration/passport')
  async passport(@Req() request: AuthenticatedRequest, @Res() response: { setHeader(name: string, value: string): void; end(body: Buffer): void }) {
    const photo = await this.enrollments.readPassport(request.user.sub);
    response.setHeader('Content-Type', photo.mimeType);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(photo.content);
  }

  @Post('learner-registration/passport')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadPassport(@Req() request: AuthenticatedRequest, @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number }) {
    return this.enrollments.savePassport(request.user.sub, file);
  }

  @Get('course-record/me')
  courseRecord(@Req() request: AuthenticatedRequest) {
    return this.enrollments.courseRecord(request.user.sub);
  }

  @Get('enrollments/me')
  listMine(@Req() request: AuthenticatedRequest) {
    return this.enrollments.listMine(request.user.sub);
  }

  @Post('courses/:courseId/enroll')
  enroll(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) {
    return this.enrollments.enrollFreeCourse(request.user.sub, courseId);
  }
}
