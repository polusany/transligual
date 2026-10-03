import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
