import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { TranslationsController } from './translations.controller';
import { InstantTranslationController } from './instant-translation.controller';
import { TranslationsService } from './translations.service';
import { TranslationRateLimitGuard } from './translation-rate-limit.guard';

@Module({ imports: [AuthModule], controllers: [TranslationsController, InstantTranslationController], providers: [TranslationsService, PrismaService, TranslationRateLimitGuard] })
export class TranslationsModule {}
