import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
}

@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() body: RegisterDto) {
    // Developer 1: replace this contract stub with AuthService + Prisma transaction on Day 2.
    return { success: true, data: { email: body.email, status: 'PENDING' } };
  }

  @Get('me')
  me() {
    return { success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Authentication guard pending' } };
  }
}
