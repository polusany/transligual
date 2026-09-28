import { PrismaService } from '../prisma.service';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type AuthenticatedRequest = { headers: { cookie?: string }; user: { sub: string; email: string; roles: string[] } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('transligual_session='));
    const cookieToken = cookie?.slice('transligual_session='.length);
    const token = cookieToken;
    if (!token) throw new UnauthorizedException('Sign in to continue.');
    try { const claims = await this.jwt.verifyAsync(token);
      const user = await this.prisma.user.findUnique({where:{id:claims.sub},select:{id:true,email:true,status:true,emailVerifiedAt:true,roles:true}});
      if(!user||user.status!=='ACTIVE'||!user.emailVerifiedAt)throw new UnauthorizedException();
      request.user={sub:user.id,email:user.email,roles:user.roles};return true; }
    catch { throw new UnauthorizedException('Invalid or expired access token.'); }
  }
}
