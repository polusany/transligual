import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('enrollments/me')
  listMine(@Req() request: AuthenticatedRequest) {
    return this.enrollments.listMine(request.user.sub);
  }

  @Post('courses/:courseId/enroll')
  enroll(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) {
    return this.enrollments.enrollFreeCourse(request.user.sub, courseId);
  }
}
