import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { translateWithGoogle } from './translation-provider';
import { TranslateTextDto } from './dto/translate-text.dto';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService) {}

  translateText(input: TranslateTextDto) {
    return translateWithGoogle(input);
  }

  async createRequest(_customerId: string, _input: CreateTranslationDto) {
    throw new GoneException('Manual translation requests have been retired. Use instant translation at /services/translation.');
  }

  // Retain private access to historical records without accepting new manual work.
  listMine(customerId: string) {
    return this.prisma.translationRequest.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  async findMine(customerId: string, id: string) {
    const request = await this.prisma.translationRequest.findFirst({ where: { id, customerId } });
    if (!request) throw new NotFoundException('Translation request not found.');
    return request;
  }
}
