import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard') dashboard() { return this.admin.dashboard(); }
  @Get('courses/review') listCourses() { return this.admin.listCoursesForReview(); }
  @Post('courses/:id/publish') publishCourse(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.admin.publishCourse(id, req.user.sub); }
  @Get('tutors/pending') listTutors() { return this.admin.listPendingTutors(); }
  @Post('tutors/:id/approve') approveTutor(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.admin.decideTutor(id, true, req.user.sub); }
  @Post('tutors/:id/reject') rejectTutor(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.admin.decideTutor(id, false, req.user.sub); }
}
