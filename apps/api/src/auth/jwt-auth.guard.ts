import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AuthenticatedRequest = { headers: { authorization?: string }; user: { sub: string; email: string; roles: string[] } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Missing bearer token.');
    try { request.user = await this.jwt.verifyAsync(token); return true; }
    catch { throw new UnauthorizedException('Invalid or expired access token.'); }
  }
}
