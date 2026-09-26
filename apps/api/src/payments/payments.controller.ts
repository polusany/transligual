import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

type PaystackRequest = AuthenticatedRequest & { rawBody?: Buffer };

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('courses/:courseId/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  checkout(@Param('courseId') courseId: string, @Req() request: AuthenticatedRequest) {
    return this.payments.initializeCourseCheckout(request.user.sub, courseId);
  }

  @Post('payments/verify/:reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  verify(@Param('reference') reference: string, @Req() request: AuthenticatedRequest) {
    return this.payments.verifyCoursePayment(request.user.sub, reference);
  }

  @Get('payments/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  mine(@Req() request: AuthenticatedRequest) {
    return this.payments.listMine(request.user.sub);
  }

  @Post('payments/webhooks/paystack')
  async paystackWebhook(@Headers('x-paystack-signature') signature: string | undefined, @Req() request: PaystackRequest, @Body() event: { event?: string; data?: { reference?: string } }) {
    if (!this.payments.verifyWebhookSignature(signature, request.rawBody)) throw new BadRequestException('Invalid payment provider signature.');
    return this.payments.handleWebhook(event);
  }
}
