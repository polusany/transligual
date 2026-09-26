import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountTokenType, UserStatus } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthEmailService } from './email.service';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const GENERIC_EMAIL_RESPONSE = 'If the account is eligible, an email with next steps will arrive shortly.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: AuthEmailService,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists.');
    }
    const passwordHash = await this.hashPassword(input.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          status: UserStatus.PENDING,
          profile: { create: { firstName: input.firstName.trim(), lastName: input.lastName.trim() } },
        },
      });
      const token = await this.createAccountToken(user.id, AccountTokenType.EMAIL_VERIFICATION);
      await this.email.sendAccountLink(email, 'verify', token);
      return { message: 'Check your email for a verification link.' };
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
    if (user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
      throw new UnauthorizedException('Verify your email address before signing in.');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.authResult(user);
  }

  async verifyEmail(token: string) {
    const accountToken = await this.findValidToken(token, AccountTokenType.EMAIL_VERIFICATION);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.accountToken.updateMany({
        where: { id: accountToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException('This verification link is invalid or has expired.');
      await tx.user.update({
        where: { id: accountToken.userId },
        data: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE },
      });
    });
    return { message: 'Your email is verified. You can now sign in.' };
  }

  async resendVerification(emailInput: string) {
    const user = await this.prisma.user.findUnique({ where: { email: emailInput.trim().toLowerCase() } });
    if (user && !user.emailVerifiedAt && [UserStatus.PENDING, UserStatus.ACTIVE].some((status) => status === user.status)) {
      const token = await this.createAccountToken(user.id, AccountTokenType.EMAIL_VERIFICATION);
      await this.email.sendAccountLink(user.email, 'verify', token);
    }
    return { message: GENERIC_EMAIL_RESPONSE };
  }

  async requestPasswordReset(emailInput: string) {
    const user = await this.prisma.user.findUnique({ where: { email: emailInput.trim().toLowerCase() } });
    if (user?.emailVerifiedAt && user.status === UserStatus.ACTIVE) {
      const token = await this.createAccountToken(user.id, AccountTokenType.PASSWORD_RESET);
      await this.email.sendAccountLink(user.email, 'reset', token);
    }
    return { message: GENERIC_EMAIL_RESPONSE };
  }

  async resetPassword(token: string, password: string) {
    const accountToken = await this.findValidToken(token, AccountTokenType.PASSWORD_RESET);
    const passwordHash = await this.hashPassword(password);
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.accountToken.updateMany({
        where: { id: accountToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException('This password reset link is invalid or has expired.');
      await tx.user.update({ where: { id: accountToken.userId }, data: { passwordHash } });
      await tx.accountToken.updateMany({
        where: { userId: accountToken.userId, type: AccountTokenType.PASSWORD_RESET, usedAt: null },
        data: { usedAt: new Date() },
      });
    });
    return { message: 'Your password has been changed. Sign in with your new password.' };
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

  private async findValidToken(token: string, type: AccountTokenType) {
    const tokenHash = this.hashToken(token);
    const accountToken = await this.prisma.accountToken.findUnique({ where: { tokenHash } });
    if (!accountToken || accountToken.type !== type || accountToken.usedAt || accountToken.expiresAt <= new Date()) {
      throw new BadRequestException('This link is invalid or has expired. Request a new one and try again.');
    }
    return accountToken;
  }

  private async createAccountToken(userId: string, type: AccountTokenType): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + (type === AccountTokenType.EMAIL_VERIFICATION ? VERIFY_TTL_MS : RESET_TTL_MS));
    await this.prisma.$transaction([
      this.prisma.accountToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } }),
      this.prisma.accountToken.create({ data: { userId, type, tokenHash: this.hashToken(token), expiresAt } }),
    ]);
    return token;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
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
