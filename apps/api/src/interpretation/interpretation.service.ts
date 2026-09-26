import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InterpretationBookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class InterpretationService {
  constructor(private readonly prisma: PrismaService) {}

  listServices() {
    return this.prisma.interpretationService.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, description: true, basePriceMinor: true, currency: true, durationUnit: true } });
  }

  async createBooking(customerId: string, input: CreateBookingDto) {
    const start = new Date(input.scheduledStartAt);
    const end = new Date(input.scheduledEndAt);
    if (start <= new Date() || end <= start) throw new BadRequestException('Choose a future start time and an end time after it.');
    if (end.getTime() - start.getTime() > 8 * 60 * 60 * 1000) throw new BadRequestException('A booking cannot be longer than eight hours.');
    const service = await this.prisma.interpretationService.findFirst({ where: { id: input.serviceId, isActive: true }, select: { id: true } });
    if (!service) throw new NotFoundException('Interpretation service not found.');
    return this.prisma.interpretationBooking.create({ data: { customerId, serviceId: service.id, sourceLanguage: input.sourceLanguage.trim(), targetLanguage: input.targetLanguage.trim(), scheduledStartAt: start, scheduledEndAt: end, customerTimezone: input.customerTimezone?.trim() || null, locationType: input.locationType, locationDetails: input.locationDetails?.trim() || null, eventDetails: input.eventDetails?.trim() || null, status: InterpretationBookingStatus.REQUESTED } });
  }

  listMine(customerId: string) {
    return this.prisma.interpretationBooking.findMany({ where: { customerId }, orderBy: { scheduledStartAt: 'desc' }, select: { id: true, sourceLanguage: true, targetLanguage: true, scheduledStartAt: true, scheduledEndAt: true, customerTimezone: true, locationType: true, status: true, quotedAmountMinor: true, currency: true, service: { select: { name: true } }, createdAt: true } });
  }
}
