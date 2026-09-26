import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
};
type WindowRecord = { count: number; resetAt: number };

const ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, WindowRecord>();
  private lastCleanupAt = 0;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const forwarded = request.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim()
      || request.ip
      || request.socket?.remoteAddress
      || 'unknown';
    const key = `${ip}:${context.getHandler().name}`;
    const now = Date.now();
    let window = this.windows.get(key);

    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + WINDOW_MS };
      this.windows.set(key, window);
    }
    window.count += 1;

    if (now - this.lastCleanupAt > 5 * 60 * 1000 || this.windows.size > 10_000) {
      for (const [entry, record] of this.windows) if (record.resetAt <= now) this.windows.delete(entry);
      this.lastCleanupAt = now;
    }
    if (window.count > ATTEMPTS) {
      throw new HttpException('Too many account requests. Wait 15 minutes and try again.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
