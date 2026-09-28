import { ForbiddenException } from '@nestjs/common';
import { ManageBookingDto, ApproveInterpreterDto } from './dto/manage-booking.dto';
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
    return this.prisma.interpretationBooking.findMany({ where: { customerId }, orderBy: { scheduledStartAt: 'desc' }, select: { id: true, sourceLanguage: true, targetLanguage: true, scheduledStartAt: true, scheduledEndAt: true, customerTimezone: true, locationType: true, meetingUrl: true, deliveryNotes: true, revisionNotes: true, status: true, quotedAmountMinor: true, currency: true, service: { select: { name: true } }, createdAt: true } });
  }

  async approveInterpreter(input:ApproveInterpreterDto,actorId:string) {
    return this.prisma.$transaction(async tx=>{
      const user=await tx.user.findUnique({where:{email:input.email.trim().toLowerCase()}});
      if(!user||user.status!=='ACTIVE'||!user.emailVerifiedAt)throw new BadRequestException('The interpreter must first register and verify their email.');
      if(!user.roles.includes('INTERPRETER'))await tx.user.update({where:{id:user.id},data:{roles:{push:'INTERPRETER'}}});
      await tx.interpreterProfile.upsert({where:{userId:user.id},create:{userId:user.id,approvalStatus:'APPROVED',languagePairs:[input.languagePairs],specializations:[],qualifications:input.qualifications},update:{approvalStatus:'APPROVED',languagePairs:[input.languagePairs],qualifications:input.qualifications}});
      await tx.auditLog.create({data:{actorUserId:actorId,action:'interpreter.approved',entityType:'User',entityId:user.id}});
      return {id:user.id,email:user.email};
    });
  }
  interpreters() {
    return this.prisma.user.findMany({where:{status:'ACTIVE',roles:{has:'INTERPRETER'},interpreterProfile:{approvalStatus:'APPROVED'}},select:{id:true,email:true,profile:{select:{firstName:true,lastName:true}}}});
  }
  listStaff(userId:string,roles:string[]) {
    const admin=roles.some(r=>['ADMIN','SUPER_ADMIN'].includes(r));
    return this.prisma.interpretationBooking.findMany({where:admin?{}:{interpreterId:userId},orderBy:{scheduledStartAt:'desc'},include:{service:true,customer:{select:{email:true}},interpreter:{select:{id:true,email:true}}}});
  }
  async manage(id:string,userId:string,roles:string[],input:ManageBookingDto) {
    return this.prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking:'+id}))`;
      const b=await tx.interpretationBooking.findUnique({where:{id}});
      if(!b)throw new NotFoundException('Booking not found.');
      const admin=roles.some(r=>['ADMIN','SUPER_ADMIN'].includes(r));
      const customer=b.customerId===userId;
      const specialist=b.interpreterId===userId&&roles.includes('INTERPRETER');
      if(!admin&&!customer&&!specialist)throw new ForbiddenException();
      const requireStatus=(states:string[])=>{if(!states.includes(b.status))throw new BadRequestException('This action is not available at the current booking stage.');};
      let data:import('@prisma/client').Prisma.InterpretationBookingUpdateInput={};
      switch(input.action) {
        case 'quote':
          if(!admin)throw new ForbiddenException();
          requireStatus(['REQUESTED','QUOTED']);
          if(!input.amountMinor||!input.currency)throw new BadRequestException('Enter quote amount and currency.');
          data={quotedAmountMinor:BigInt(input.amountMinor),currency:input.currency,status:'QUOTED'};break;
        case 'assign':
          if(!admin)throw new ForbiddenException();
          requireStatus(['CONFIRMED','INTERPRETER_ASSIGNED']);
          if(!input.interpreterId)throw new BadRequestException('Select an approved interpreter.');
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'interpreter:'+input.interpreterId}))`;
          if(!await tx.user.findFirst({where:{id:input.interpreterId,status:'ACTIVE',roles:{has:'INTERPRETER'},interpreterProfile:{approvalStatus:'APPROVED',availabilityStatus:'AVAILABLE'}}}))throw new BadRequestException('Select an available, approved interpreter.');
          if(await tx.interpretationBooking.findFirst({where:{id:{not:id},interpreterId:input.interpreterId,status:{in:['INTERPRETER_ASSIGNED','IN_PROGRESS','REVISION_REQUIRED']},scheduledStartAt:{lt:b.scheduledEndAt},scheduledEndAt:{gt:b.scheduledStartAt}}}))throw new BadRequestException('The interpreter already has an overlapping booking.');
          data={interpreter:{connect:{id:input.interpreterId}},meetingUrl:input.meetingUrl,status:'INTERPRETER_ASSIGNED'};break;
        case 'start':
          if(!admin&&!specialist)throw new ForbiddenException();
          requireStatus(['INTERPRETER_ASSIGNED','REVISION_REQUIRED']);data={status:'IN_PROGRESS'};break;
        case 'deliver':
          if(!admin&&!specialist)throw new ForbiddenException();
          requireStatus(['IN_PROGRESS']);
          if(!input.notes)throw new BadRequestException('Provide a session summary or delivery details.');
          data={deliveryNotes:input.notes,status:'DELIVERED'};break;
        case 'revise':
          if(!customer)throw new ForbiddenException();
          requireStatus(['DELIVERED']);
          if(!input.notes)throw new BadRequestException('Describe the issue to resolve.');
          data={revisionNotes:input.notes,status:'REVISION_REQUIRED'};break;
        case 'complete':
          if(!customer&&!admin)throw new ForbiddenException();
          requireStatus(['DELIVERED']);data={status:'COMPLETED'};break;
        case 'cancel':
          if(!customer&&!admin)throw new ForbiddenException();
          requireStatus(['REQUESTED','QUOTED']);data={status:'CANCELLED'};break;
      }
      const updated=await tx.interpretationBooking.update({where:{id},data});
      await tx.auditLog.create({data:{actorUserId:userId,action:'interpretation.'+input.action,entityType:'InterpretationBooking',entityId:id}});
      return updated;
    });
  }
}
