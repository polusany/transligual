import { BadGatewayException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { TranslateTextDto } from './dto/translate-text.dto';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async translateText(input: TranslateTextDto) {
    const apiKey = this.config.get<string>('GOOGLE_TRANSLATE_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('Instant translation is not configured yet. Add GOOGLE_TRANSLATE_API_KEY to the API environment.');

    let response: Response;
    try {
      response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: input.text, target: input.targetLanguage, source: input.sourceLanguage, format: 'text' }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new BadGatewayException('The translation service could not be reached. Please try again.');
    }

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== 'object' || !('data' in body)) {
      throw new BadGatewayException('Translation is temporarily unavailable. Check the provider configuration and try again.');
    }
    const data = body.data;
    if (!data || typeof data !== 'object' || !('translations' in data) || !Array.isArray(data.translations)) {
      throw new BadGatewayException('The translation service returned an unexpected response.');
    }
    const translated = data.translations[0];
    if (!translated || typeof translated !== 'object' || !('translatedText' in translated) || typeof translated.translatedText !== 'string') {
      throw new BadGatewayException('The translation service returned no translated text.');
    }
    return {
      translatedText: translated.translatedText,
      detectedSourceLanguage: 'detectedSourceLanguage' in translated && typeof translated.detectedSourceLanguage === 'string' ? translated.detectedSourceLanguage : input.sourceLanguage ?? null,
      targetLanguage: input.targetLanguage,
    };
  }

  createRequest(customerId: string, input: CreateTranslationDto) {
    return this.prisma.translationRequest.create({ data: { customerId, sourceLanguage: input.sourceLanguage.trim(), targetLanguage: input.targetLanguage.trim(), serviceType: input.serviceType, documentType: input.documentType?.trim() || null, pageCount: input.pageCount ?? null, deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : null, instructions: input.instructions?.trim() || null } });
  }

  listMine(customerId: string) {
    return this.prisma.translationRequest.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, select: { id: true, sourceLanguage: true, targetLanguage: true, serviceType: true, documentType: true, pageCount: true, deadlineAt: true, instructions: true, quotedAmountMinor: true, currency: true, status: true, createdAt: true } });
  }

  async findMine(customerId: string, id: string) {
    const request = await this.prisma.translationRequest.findFirst({ where: { id, customerId }, select: { id: true, sourceLanguage: true, targetLanguage: true, serviceType: true, documentType: true, pageCount: true, deadlineAt: true, instructions: true, quotedAmountMinor: true, currency: true, status: true, createdAt: true, updatedAt: true } });
    if (!request) throw new NotFoundException('Translation request not found.');
    return request;
  }
}
