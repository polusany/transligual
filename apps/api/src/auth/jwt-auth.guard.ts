import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AuthenticatedRequest = { headers: { cookie?: string }; user: { sub: string; email: string; roles: string[] } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('transligual_session='));
    const cookieToken = cookie?.slice('transligual_session='.length);
    const token = cookieToken;
    if (!token) throw new UnauthorizedException('Sign in to continue.');
    try { request.user = await this.jwt.verifyAsync(token); return true; }
    catch { throw new UnauthorizedException('Invalid or expired access token.'); }
  }
}
