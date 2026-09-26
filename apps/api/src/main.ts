import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ApiResponseInterceptor } from './common/api-response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.AUTH_JWT_SECRET ?? '';
  const origins = (process.env.APP_URL ?? (isProduction ? '' : 'http://localhost:3000'))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && (jwtSecret.length < 32 || /^(replace|change-me|example|your-)/i.test(jwtSecret))) {
    throw new Error('Set AUTH_JWT_SECRET to a unique random value of at least 32 characters in production.');
  }
  if (isProduction && origins.length === 0) {
    throw new Error('APP_URL must list the public website origin(s) in production.');
  }
  if (isProduction && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_replace') || !process.env.EMAIL_FROM || process.env.EMAIL_FROM.includes('.example') || !process.env.WEB_APP_URL)) {
    throw new Error('RESEND_API_KEY, EMAIL_FROM, and WEB_APP_URL are required for account verification and recovery emails.');
  }
  if (isProduction && (!process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY.startsWith('replace-'))) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is required for the public instant-translation tool.');
  }
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || origin === '*') {
      throw new Error(`APP_URL contains an invalid origin: ${origin}`);
    }
    if (isProduction && parsed.protocol !== 'https:') {
      throw new Error('Production APP_URL origins must use HTTPS.');
    }
  }
  if (isProduction && process.env.WEB_APP_URL) {
    const webUrl = new URL(process.env.WEB_APP_URL);
    if (webUrl.protocol !== 'https:' || !origins.includes(webUrl.origin)) {
      throw new Error('WEB_APP_URL must be an HTTPS origin included in APP_URL.');
    }
  }

  if (isProduction) {
    for (const key of ['DATABASE_URL', 'DIRECT_DATABASE_URL']) {
      const value = process.env[key];
      if (!value) throw new Error(`${key} must be set in production.`);
      const databaseUrl = new URL(value);
      if (!['postgres:', 'postgresql:'].some((protocol) => protocol === databaseUrl.protocol)) {
        throw new Error(`${key} must be a PostgreSQL connection URL.`);
      }
      const databasePassword = decodeURIComponent(databaseUrl.password);
      if (databasePassword.length < 24 || /^(replace|change-me|example|your-)/i.test(databasePassword)) {
        throw new Error(`${key} must contain a unique database password of at least 24 characters.`);
      }
    }
  }

  const port = Number(process.env.API_PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be a valid TCP port.');
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: origins });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  logger.log(`API listening on port ${port}`);
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(error instanceof Error ? error.message : 'API startup failed.');
  process.exitCode = 1;
});
