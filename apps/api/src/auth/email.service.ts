import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendAccountLink(to: string, purpose: 'verify' | 'reset', token: string): Promise<void> {
    const webUrl = (this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    const url = `${webUrl}/${purpose === 'verify' ? 'verify-email' : 'reset-password'}#token=${encodeURIComponent(token)}`;
    const isVerification = purpose === 'verify';
    const subject = isVerification ? 'Verify your Transligual email' : 'Reset your Transligual password';
    const action = isVerification ? 'Verify email address' : 'Choose a new password';
    const expiry = isVerification ? '24 hours' : '30 minutes';
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');

    if (!apiKey || !from) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException('Email delivery is not configured. Please try again later.');
      }
      this.logger.warn(`Local ${purpose} link for ${to}: ${url}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#1f2937"><h1>${subject}</h1><p>Use the button below to continue. This link expires in ${expiry}.</p><p><a href="${url}" style="display:inline-block;background:#176f62;color:white;padding:14px 20px;border-radius:8px;text-decoration:none">${action}</a></p><p>If you did not request this, you can ignore this email.</p></main>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      this.logger.error(`Email provider rejected a ${purpose} email (HTTP ${response.status}).`);
      throw new ServiceUnavailableException('We could not send the email right now. Please try again shortly.');
    }
  }
}
