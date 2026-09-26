import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TranslateTextDto } from './dto/translate-text.dto';
import { TranslationRateLimitGuard } from './translation-rate-limit.guard';
import { TranslationsService } from './translations.service';

@Controller('translations')
export class InstantTranslationController {
  constructor(private readonly translations: TranslationsService) {}

  @Post('translate')
  @UseGuards(TranslationRateLimitGuard)
  translate(@Body() body: TranslateTextDto) {
    return this.translations.translateText(body);
  }
}
