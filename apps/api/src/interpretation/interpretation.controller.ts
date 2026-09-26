import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InterpretationService } from './interpretation.service';

@Controller('interpretation')
export class InterpretationController {
  constructor(private readonly interpretation: InterpretationService) {}
  @Get('services') services() { return this.interpretation.listServices(); }
  @Get('bookings/me') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STUDENT)
  mine(@Req() request: AuthenticatedRequest) { return this.interpretation.listMine(request.user.sub); }
  @Post('bookings') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STUDENT)
  book(@Body() body: CreateBookingDto, @Req() request: AuthenticatedRequest) { return this.interpretation.createBooking(request.user.sub, body); }
}
