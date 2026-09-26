import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TutorApplicationDto } from './dto/tutor-application.dto';
import { TutorsService } from './tutors.service';

@Controller('tutors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class TutorsController {
  constructor(private readonly tutors: TutorsService) {}

  @Post('apply')
  apply(@Body() body: TutorApplicationDto, @Req() request: AuthenticatedRequest) {
    return this.tutors.apply(request.user.sub, body);
  }
}
