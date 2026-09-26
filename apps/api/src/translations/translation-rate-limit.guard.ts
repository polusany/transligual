import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RequestLike = { headers: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } };
type WindowRecord = { count: number; resetAt: number };
const MAX_TRANSLATIONS = 30;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class TranslationRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, WindowRecord>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const forwarded = request.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() || request.ip || request.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = this.windows.get(ip);
    if (!record || record.resetAt <= now) this.windows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    else if (++record.count > MAX_TRANSLATIONS) throw new HttpException('Translation limit reached. Please wait and try again.', HttpStatus.TOO_MANY_REQUESTS);
    if (this.windows.size > 10_000) for (const [key, entry] of this.windows) if (entry.resetAt <= now) this.windows.delete(key);
    return true;
  }
}
