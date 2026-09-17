import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists.');
    }
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1,
    });
    try {
      const user = await this.prisma.user.create({
        data: {
          email, passwordHash, status: UserStatus.ACTIVE,
          profile: { create: { firstName: input.firstName.trim(), lastName: input.lastName.trim() } },
        }, include: { profile: true },
      });
      return this.authResult(user);
    } catch (error: unknown) {
      if (this.isUniqueConstraint(error)) throw new ConflictException('An account with this email already exists.');
      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() }, include: { profile: true },
    });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('This account is not active.');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.authResult(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, roles: true, status: true, createdAt: true,
        profile: { select: { firstName: true, lastName: true, displayName: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Account no longer exists.');
    return user;
  }

  private authResult(user: { id: string; email: string; roles: string[]; status: UserStatus; createdAt: Date; profile: { firstName: string; lastName: string; displayName: string | null } | null }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, roles: user.roles }),
      user: { id: user.id, email: user.email, roles: user.roles, status: user.status, createdAt: user.createdAt, profile: user.profile },
    };
  }

  private isUniqueConstraint(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
