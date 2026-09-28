import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountTokenType, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({ verify: jest.fn(), hash: jest.fn(), argon2id: 2 }));

describe('first login email verification', () => {
  let prisma: any;
  let service: AuthService;
  let email: any;
  let jwt: any;
  const user = { id: 'u1', email: 'learner@example.com', passwordHash: 'hash', roles: [],
    status: UserStatus.PENDING, emailVerifiedAt: null, createdAt: new Date(), profile: null };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ ...user }), update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...user, status: UserStatus.ACTIVE, emailVerifiedAt: new Date() }) },
      accountToken: { findUnique: jest.fn().mockResolvedValue({ id: 't1', userId: 'u1', type: AccountTokenType.EMAIL_VERIFICATION,
        usedAt: null, expiresAt: new Date(Date.now() + 60000) }), updateMany: jest.fn().mockResolvedValue({ count: 1 }), create: jest.fn() },
    };
    prisma.$transaction = jest.fn((work) => typeof work === 'function' ? work(prisma) : Promise.all(work));
    email = { sendAccountLink: jest.fn().mockResolvedValue(undefined) };
    jwt = { sign: jest.fn().mockReturnValue('session-token') };
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    service = new AuthService(prisma, jwt, email);
  });

  it('sends verification after a correct first login without creating a session', async () => {
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };
    const result = await new AuthController(service).login({ email: user.email, password: 'password' }, response);
    expect(result.data).toMatchObject({ verificationRequired: true });
    expect(email.sendAccountLink).toHaveBeenCalledWith(user.email, 'verify', expect.any(String));
    expect(response.cookie).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('signs a verified user in with a password without sending another email', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, status: UserStatus.ACTIVE, emailVerifiedAt: new Date() });
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };
    await new AuthController(service).login({ email: user.email, password: 'password' }, response);
    expect(response.cookie).toHaveBeenCalledWith('transligual_session', 'session-token', expect.objectContaining({ httpOnly: true, path: '/api/v1' }));
    expect(email.sendAccountLink).not.toHaveBeenCalled();
  });

  it('does not send email for an incorrect password', async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow('Invalid');
    expect(email.sendAccountLink).not.toHaveBeenCalled();
  });

  it('rejects suspended accounts at login', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...user, status: UserStatus.SUSPENDED });
    await expect(service.login({ email: user.email, password: 'password' })).rejects.toThrow('cannot sign in');
    expect(email.sendAccountLink).not.toHaveBeenCalled();
  });

  it('consumes a verification link and sets the session cookie without exposing the token', async () => {
    const response = { cookie: jest.fn(), clearCookie: jest.fn() };
    const result = await new AuthController(service).verifyEmail({ token: 'verification-token' }, response);
    expect(result.data.user.id).toBe('u1');
    expect(result.data).not.toHaveProperty('accessToken');
    expect(response.cookie).toHaveBeenCalledWith('transligual_session', 'session-token', expect.objectContaining({ httpOnly: true }));
    expect(prisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u1', status: { in: [UserStatus.PENDING, UserStatus.ACTIVE] }, emailVerifiedAt: null },
    }));
  });

  it('rejects expired links', async () => {
    prisma.accountToken.findUnique.mockResolvedValue({ type: AccountTokenType.EMAIL_VERIFICATION, expiresAt: new Date(0) });
    await expect(service.verifyEmail('expired')).rejects.toThrow('expired');
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('rejects a link already consumed by another request', async () => {
    prisma.accountToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.verifyEmail('used')).rejects.toThrow('expired');
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('does not reactivate an account suspended after the email was sent', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.verifyEmail('blocked')).rejects.toThrow('cannot be verified');
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
