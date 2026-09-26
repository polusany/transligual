import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LearningService } from './learning.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class LearningController {
  constructor(private readonly learning: LearningService) {}
  @Get('courses/:courseId/learn') getCourse(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) { return this.learning.getCourse(request.user.sub, courseId); }
  @Get('courses/:courseId/progress') getProgress(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) { return this.learning.getCourse(request.user.sub, courseId).then((result) => result.progress); }
  @Post('lessons/:lessonId/progress') updateProgress(@Param('lessonId') lessonId: string, @Body() body: UpdateProgressDto, @Req() request: AuthenticatedRequest) { return this.learning.updateProgress(request.user.sub, lessonId, body); }
  @Post('lessons/:lessonId/complete') complete(@Param('lessonId') lessonId: string, @Req() request: AuthenticatedRequest) { return this.learning.updateProgress(request.user.sub, lessonId, { progressPercentage: 100, lastPositionSeconds: 0 }); }
}
