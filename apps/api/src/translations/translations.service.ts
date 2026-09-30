import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { CreateTranslationDto, ReplyTranslationDto } from './dto/create-translation.dto';
import { TranslateTextDto } from './dto/translate-text.dto';

@Injectable()
export class TranslationsService {
  constructor(private readonly prisma: PrismaService, private readonly limits: RateLimitService) {}

  translateText(_input: TranslateTextDto) {
    throw new GoneException('Instant translation has been replaced. Submit a text request at /services/translation for an administrator to reply.');
  }

  async createRequest(customerId: string, input: CreateTranslationDto) {
    if (input.sourceLanguage.toLowerCase() === input.targetLanguage.toLowerCase()) throw new BadRequestException('Choose two different languages.');
    await this.limits.consume('translation:requests:'+customerId, 20, 86400000);
    return this.prisma.translationRequest.create({ data: { customerId, sourceLanguage: input.sourceLanguage, targetLanguage: input.targetLanguage, sourceText: input.sourceText, serviceType: 'GENERAL_DOCUMENT' } });
  }

  listMine(customerId: string) {
    return this.prisma.translationRequest.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  async findMine(customerId: string, id: string) {
    const request = await this.prisma.translationRequest.findFirst({ where: { id, customerId } });
    if (!request) throw new NotFoundException('Translation request not found.');
    return request;
  }

  listForAdmin() {
    return this.prisma.translationRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: { select: { email: true } } } });
  }

  async reply(id: string, actorId: string, input: ReplyTranslationDto) {
    return this.prisma.$transaction(async tx => {
      const request = await tx.translationRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Translation request not found.');
      if (!request.sourceText) throw new ConflictException('This older request has no source text. Ask the customer to submit a new text request.');
      const result = await tx.translationRequest.updateMany({ where: { id, status: 'REQUESTED' }, data: { translatedText: input.translatedText, repliedAt: new Date(), repliedById: actorId, status: 'COMPLETED' } });
      if (!result.count) throw new ConflictException('This request has already been answered or is no longer awaiting a reply. Refresh the list.');
      await tx.auditLog.create({ data: { actorUserId: actorId, action: 'translation.replied', entityType: 'TranslationRequest', entityId: id } });
      return tx.translationRequest.findUnique({ where: { id } });
    });
  }
}
