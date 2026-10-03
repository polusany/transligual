import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, PaymentItemType } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { requireRegistration } from '../enrollments/require-registration';
type Transaction = {reference:string;status:string;amount:number|string;currency:string};
export function providerStatus(status:string):PaymentStatus {
 if(status==='success') return 'SUCCESSFUL';
 if(status==='abandoned') return 'CANCELLED';
 if(status==='failed') return 'FAILED';
 if(status==='reversed') return 'REFUNDED';
 return 'PROCESSING';
}
@Injectable()
export class PaymentsService {
 constructor(private readonly prisma:PrismaService,private readonly config:ConfigService){}
 private get secretKey(){const value=this.config.get<string>('PAYSTACK_SECRET_KEY');if(!value)throw new ServiceUnavailableException('Checkout is not configured yet.');return value;}
 async initializeCourseCheckout(userId:string,id:string){await requireRegistration(this.prisma,userId);return this.initialize(userId,id,'COURSE');}
 initializeInterpretationCheckout(userId:string,id:string){return this.initialize(userId,id,'INTERPRETATION');}
 private async initialize(userId:string,id:string,type:PaymentItemType) {
  const secret=this.secretKey;
  const user=await this.prisma.user.findUnique({where:{id:userId}});
  if(user?.status!=='ACTIVE') throw new ConflictException('An active account is required.');
  const payment=await this.prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId+':'+type+':'+id}))`;
   if(type==='INTERPRETATION')await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking:'+id}))`;
   let amount:bigint;let currency:string;let title:string;
   if(type==='COURSE') {
    const course=await tx.course.findUnique({where:{id}});
    if(!course||course.status!=='PUBLISHED'||course.priceMinor<=0n)throw new ConflictException('Choose a published paid course.');
    if(await tx.enrollment.findFirst({where:{studentId:userId,courseId:id,status:{in:['ACTIVE','COMPLETED']}}}))throw new ConflictException('You already have course access.');
    amount=course.priceMinor;currency=course.currency;title=course.title;
   } else {
    const booking=await tx.interpretationBooking.findFirst({where:{id,customerId:userId}});
    if(!booking||!['QUOTED','PAYMENT_PENDING'].includes(booking.status)||!booking.quotedAmountMinor||!booking.currency)throw new ConflictException('This booking has no payable quote.');
    amount=booking.quotedAmountMinor;currency=booking.currency;title='Interpretation booking';
   }
   const pending=await tx.payment.findFirst({where:{userId,status:{in:['PENDING','PROCESSING']},items:{some:{itemType:type,referenceId:id}}},orderBy:{createdAt:'desc'}});
   if(pending) return pending;
   if(type==='INTERPRETATION')await tx.interpretationBooking.update({where:{id},data:{status:'PAYMENT_PENDING'}});
   return tx.payment.create({data:{userId,provider:'PAYSTACK',providerReference:'TL-'+randomUUID().replaceAll('-',''),amountMinor:amount,currency:currency.toUpperCase(),items:{create:{itemType:type,referenceId:id,description:title,amountMinor:amount}}}});
  });
  const saved=payment.metadata as {authorizationUrl?:string}|null;
  if(saved?.authorizationUrl) return {paymentId:payment.id,reference:payment.providerReference,authorizationUrl:saved.authorizationUrl};
  // A concurrent initialization returns a recoverable message rather than creating another charge.
  const claimed=await this.prisma.payment.updateMany({where:{id:payment.id,status:'PENDING'},data:{status:'PROCESSING'}});
  if(!claimed.count)throw new ConflictException('Checkout is being prepared. Please retry shortly.');
  try {
   const result=await this.request<{authorization_url:string;reference:string}>('/transaction/initialize',{email:user.email,amount:payment.amountMinor.toString(),currency:payment.currency,reference:payment.providerReference,callback_url:this.config.get('PAYSTACK_CALLBACK_URL') || (this.config.get('APP_URL') || 'http://localhost:3000')+'/payments/return'},secret);
   if(result.reference!==payment.providerReference || new URL(result.authorization_url).protocol!=='https:')throw new Error('Invalid checkout response');
   await this.prisma.payment.update({where:{id:payment.id},data:{metadata:{authorizationUrl:result.authorization_url}}});
   return {paymentId:payment.id,reference:payment.providerReference,authorizationUrl:result.authorization_url};
  }catch {
   await this.prisma.$transaction(async tx=>{
    await tx.payment.updateMany({where:{id:payment.id,status:{in:['PENDING','PROCESSING']}},data:{status:'FAILED'}});
    if(type==='INTERPRETATION')await tx.interpretationBooking.updateMany({where:{id,status:'PAYMENT_PENDING'},data:{status:'QUOTED'}});
   });
   throw new ServiceUnavailableException('Checkout could not be started. Please try again.');
  }
 }
 async verifyCoursePayment(userId:string,reference:string) {
  const payment=await this.prisma.payment.findUnique({where:{providerReference:reference}});
  if(!payment||payment.userId!==userId)throw new ConflictException('Payment not found for this account.');
  return this.verifyAndFulfil(reference,userId);
 }
 async verifyAndFulfil(reference:string,expectedUserId?:string) {
  const payment=await this.prisma.payment.findUnique({where:{providerReference:reference},include:{items:true}});
  if(!payment||payment.provider!=='PAYSTACK'||(expectedUserId&&payment.userId!==expectedUserId))throw new ConflictException('Invalid payment reference.');
  if(['REFUNDED','PARTIALLY_REFUNDED'].includes(payment.status))return {status:payment.status,enrollmentId:null};
  const result=await this.request<Transaction>('/transaction/verify/'+encodeURIComponent(reference));
  if(result.reference!==reference || typeof result.currency!=='string' || result.currency.toUpperCase()!==payment.currency || !/^\d+$/.test(String(result.amount)) || BigInt(result.amount)!==payment.amountMinor)throw new ConflictException('Verified payment amount, currency or reference does not match.');
  const status=providerStatus(result.status);
  return this.prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${payment.id}))`;
   const current=await tx.payment.findUniqueOrThrow({where:{id:payment.id}});
   const item=payment.items[0];
   if(item?.itemType==='INTERPRETATION')await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'booking:'+item.referenceId}))`;
   if(!item||payment.items.length!==1||!['COURSE','INTERPRETATION'].includes(item.itemType))throw new ConflictException('Unsupported payment item.');
   if(['REFUNDED','PARTIALLY_REFUNDED'].includes(current.status))return {status:current.status,enrollmentId:null};
   if(current.status==='SUCCESSFUL' && status!=='REFUNDED') {
    const enrollment=item.itemType==='COURSE'?await tx.enrollment.findUnique({where:{studentId_courseId:{studentId:payment.userId,courseId:item.referenceId}}}):null;
    return {status:current.status,enrollmentId:enrollment?.id??null,itemType:item.itemType};
   }
   await tx.payment.update({where:{id:payment.id},data:{status,paidAt:status==='SUCCESSFUL'?new Date():current.paidAt}});
   let enrollmentId:string|null=null;
   if(status==='SUCCESSFUL') {
    if(item.itemType==='COURSE') {
     const existing=await tx.enrollment.findUnique({where:{studentId_courseId:{studentId:payment.userId,courseId:item.referenceId}}});
     if(existing&&['ACTIVE','COMPLETED'].includes(existing.status))enrollmentId=existing.id;
     else {const enrollment=await tx.enrollment.upsert({where:{studentId_courseId:{studentId:payment.userId,courseId:item.referenceId}},create:{studentId:payment.userId,courseId:item.referenceId,paymentId:payment.id,status:'ACTIVE'},update:{paymentId:payment.id,status:'ACTIVE',completedAt:null}});enrollmentId=enrollment.id;}
    } else {
     const booking=await tx.interpretationBooking.findUnique({where:{id:item.referenceId}});
     if(!booking||booking.customerId!==payment.userId||booking.quotedAmountMinor!==payment.amountMinor||booking.currency!==payment.currency||!['QUOTED','PAYMENT_PENDING'].includes(booking.status))throw new ConflictException('The booking changed; staff must review this payment.');
     await tx.interpretationBooking.update({where:{id:booking.id},data:{status:'CONFIRMED'}});
    }
    await tx.auditLog.create({data:{actorUserId:payment.userId,action:'payment.verified',entityType:'Payment',entityId:payment.id}});
   } else if(status==='REFUNDED') {

    await tx.enrollment.updateMany({where:{paymentId:payment.id},data:{status:'REFUNDED'}});
    if(item.itemType==='COURSE')await tx.certificate.updateMany({where:{studentId:payment.userId,courseId:item.referenceId,status:'ACTIVE'},data:{status:'REVOKED'}});

    if(item.itemType==='INTERPRETATION')await tx.interpretationBooking.update({where:{id:item.referenceId},data:{status:'REFUNDED'}});
   } else if(item.itemType==='INTERPRETATION'&&['FAILED','CANCELLED'].includes(status)) {
    await tx.interpretationBooking.updateMany({where:{id:item.referenceId,status:'PAYMENT_PENDING'},data:{status:'QUOTED'}});
   }
   return {status,enrollmentId,itemType:item.itemType};
  });
 }
 listMine(userId:string){return this.prisma.payment.findMany({where:{userId},orderBy:{createdAt:'desc'},select:{id:true,providerReference:true,amountMinor:true,currency:true,status:true,paidAt:true,items:{select:{description:true,itemType:true}}}});}
 verifyWebhookSignature(signature:string|undefined,rawBody:Buffer|undefined) {
  const secret=this.config.get<string>('PAYSTACK_SECRET_KEY');
  if(!secret||!signature||!rawBody||!/^[a-f0-9]{128}$/i.test(signature))return false;
  return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha512',secret).update(rawBody).digest());
 }
 async handleWebhook(event:{event?:string;data?:{reference?:string}}) {
  if(event.event==='charge.success'&&event.data?.reference)await this.verifyAndFulfil(event.data.reference);
  return {received:true};
 }
 private async request<T>(path:string,body?:unknown,secret=this.secretKey):Promise<T> {
  try {const response=await fetch('https://api.paystack.co'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
   const result=await response.json() as {status:boolean;data:T};if(!response.ok||!result.status||!result.data)throw new Error('Provider error');return result.data;
  }catch{throw new ServiceUnavailableException('The payment provider is temporarily unavailable.');}
 }
}
