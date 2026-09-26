import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AccountTokenDto, EmailDto, PasswordResetDto } from './dto/account-token.dto';

type CookieResponse = {
  cookie: (name: string, value: string, options: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string; maxAge: number }) => void;
  clearCookie: (name: string, options: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string }) => void;
};

const SESSION_COOKIE = 'transligual_session';
const SESSION_MAX_AGE_MS = 30 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() body: RegisterDto) {
    return { success: true, data: await this.auth.register(body) };
  }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.auth.login(body);
    response.cookie(SESSION_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1',
      maxAge: SESSION_MAX_AGE_MS,
    });
    return { success: true, data: { user: result.user } };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: CookieResponse) {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1',
    });
    return { success: true, data: { message: 'You have been signed out.' } };
  }

  @Post('verify-email')
  @UseGuards(AuthRateLimitGuard)
  async verifyEmail(@Body() body: AccountTokenDto) {
    return { success: true, data: await this.auth.verifyEmail(body.token) };
  }

  @Post('resend-verification')
  @UseGuards(AuthRateLimitGuard)
  async resendVerification(@Body() body: EmailDto) {
    return { success: true, data: await this.auth.resendVerification(body.email) };
  }

  @Post('forgot-password')
  @UseGuards(AuthRateLimitGuard)
  async forgotPassword(@Body() body: EmailDto) {
    return { success: true, data: await this.auth.requestPasswordReset(body.email) };
  }

  @Post('reset-password')
  @UseGuards(AuthRateLimitGuard)
  async resetPassword(@Body() body: PasswordResetDto) {
    return { success: true, data: await this.auth.resetPassword(body.token, body.password) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: AuthenticatedRequest) {
    return { success: true, data: await this.auth.me(request.user.sub) };
  }
}
