import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { ResignationDto, ReviewResignationDto } from './communications.dto';
type Resignation = {id:string;tutorId:string;lastTeachingDate:Date;letter:string;signedName:string;status:string;reviewNotes:string|null;reviewedAt:Date|null;createdAt:Date};
type Thread = {id:string;ownerId:string};
type Message = {id:string;body:string;fromSupport:boolean;createdAt:Date};
@Injectable()
export class CommunicationsService {
 constructor(private readonly prisma:PrismaService, private readonly limits:RateLimitService) {}
 myResignations(tutorId:string){return this.prisma.$queryRaw<Resignation[]>`SELECT * FROM "TutorResignation" WHERE "tutorId"=${tutorId} ORDER BY "createdAt" DESC`;}
 async submitResignation(tutorId:string,input:ResignationDto){
  await this.limits.consume('resignation:'+tutorId,5,86400000);
  return this.prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tutorId+':resignation'}))`;
   const user=await tx.user.findUnique({where:{id:tutorId},select:{roles:true,tutorProfile:{select:{approvalStatus:true}}}});
   if(!user?.roles.includes('TUTOR')||user.tutorProfile?.approvalStatus!=='APPROVED')throw new ForbiddenException('An approved tutor account is required.');
   const existing=await tx.$queryRaw<Resignation[]>`SELECT "id" FROM "TutorResignation" WHERE "tutorId"=${tutorId} AND "status" IN ('PENDING','APPROVED') LIMIT 1`;
   if(existing.length)throw new ConflictException('You already have a pending or approved resignation.');
   const id=randomUUID();
   const rows=await tx.$queryRaw<Resignation[]>`INSERT INTO "TutorResignation" ("id","tutorId","lastTeachingDate","letter","signedName") VALUES (${id},${tutorId},${input.lastTeachingDate}::date,${input.letter},${input.signedName}) RETURNING *`;
   return rows[0];
  });
 }
 listResignations(){return this.prisma.$queryRaw`SELECT r.*, u."email", p."firstName",p."lastName" FROM "TutorResignation" r JOIN "User" u ON u."id"=r."tutorId" LEFT JOIN "Profile" p ON p."userId"=u."id" ORDER BY CASE WHEN r."status"='PENDING' THEN 0 ELSE 1 END,r."createdAt" DESC LIMIT 100`;}
 async reviewResignation(id:string,actorId:string,input:ReviewResignationDto){
  return this.prisma.$transaction(async tx=>{
   const rows=await tx.$queryRaw<Resignation[]>`SELECT * FROM "TutorResignation" WHERE "id"=${id} FOR UPDATE`;
   const resignation=rows[0];if(!resignation)throw new NotFoundException('Resignation not found.');
   if(resignation.tutorId===actorId)throw new ForbiddenException('Another administrator must review your resignation.');
   if(resignation.status!=='PENDING')throw new ConflictException('This resignation has already been reviewed.');
   await tx.$executeRaw`UPDATE "TutorResignation" SET "status"=${input.decision},"reviewNotes"=${input.notes},"reviewedById"=${actorId},"reviewedAt"=NOW() WHERE "id"=${id}`;
   if(input.decision==='APPROVED'){
    // Preserve the account and all course records; end tutor permissions immediately on approval.
    await tx.$executeRaw`UPDATE "User" SET "roles"=array_remove("roles",'TUTOR'::"UserRole"),"updatedAt"=NOW() WHERE "id"=${resignation.tutorId}`;
   }
   await tx.auditLog.create({data:{actorUserId:actorId,action:input.decision==='APPROVED'?'tutor.resignation.approved':'tutor.resignation.declined',entityType:'TutorResignation',entityId:id}});
   return {id,status:input.decision};
  });
 }
 async getChat(ownerId:string){
  const threads=await this.prisma.$queryRaw<Thread[]>`SELECT "id","ownerId" FROM "SupportThread" WHERE "ownerId"=${ownerId}`;
  if(!threads[0])return {id:null,messages:[]};
  return this.readThread(threads[0].id,ownerId,false);
 }
 async readThread(id:string,actorId:string,staff:boolean){
  const threads=await this.prisma.$queryRaw<Thread[]>`SELECT "id","ownerId" FROM "SupportThread" WHERE "id"=${id}`;
  const thread=threads[0];if(!thread||(!staff&&thread.ownerId!==actorId))throw new NotFoundException('Conversation not found.');
  if(staff)await this.prisma.$executeRaw`UPDATE "SupportThread" SET "lastReadByAdminAt"=NOW() WHERE "id"=${id}`;
  else await this.prisma.$executeRaw`UPDATE "SupportThread" SET "lastReadByUserAt"=NOW() WHERE "id"=${id}`;
  const messages=await this.prisma.$queryRaw<Message[]>`SELECT "id","body","fromSupport","createdAt" FROM "SupportMessage" WHERE "threadId"=${id} ORDER BY "createdAt" DESC,"id" DESC LIMIT 100`;
  return {id:thread.id,messages:messages.reverse()};
 }
 async sendMessage(actorId:string,body:string,threadId?:string){
  await this.limits.consume('support:'+actorId,20,60000);
  return this.prisma.$transaction(async tx=>{
   let id=threadId;
   if(!id){const threads=await tx.$queryRaw<Thread[]>`INSERT INTO "SupportThread" ("id","ownerId","updatedAt") VALUES (${randomUUID()},${actorId},NOW()) ON CONFLICT ("ownerId") DO UPDATE SET "updatedAt"=NOW() RETURNING "id","ownerId"`;id=threads[0].id;}
   else {const threads=await tx.$queryRaw<Thread[]>`SELECT "id","ownerId" FROM "SupportThread" WHERE "id"=${id}`;if(!threads[0])throw new NotFoundException('Conversation not found.');}
   const fromSupport=Boolean(threadId);
   const messages=await tx.$queryRaw<Message[]>`INSERT INTO "SupportMessage" ("id","threadId","senderId","body","fromSupport") VALUES (${randomUUID()},${id},${actorId},${body},${fromSupport}) RETURNING "id","body","fromSupport","createdAt"`;
   await tx.$executeRaw`UPDATE "SupportThread" SET "updatedAt"=NOW() WHERE "id"=${id}`;
   return {threadId:id,message:messages[0]};
  });
 }
 listChats(){return this.prisma.$queryRaw`SELECT t."id",t."updatedAt",u."email",p."firstName",p."lastName",(SELECT m."body" FROM "SupportMessage" m WHERE m."threadId"=t."id" ORDER BY m."createdAt" DESC,m."id" DESC LIMIT 1) AS "lastMessage",(SELECT COUNT(*)::int FROM "SupportMessage" m WHERE m."threadId"=t."id" AND m."fromSupport"=false AND (t."lastReadByAdminAt" IS NULL OR m."createdAt">t."lastReadByAdminAt")) AS "unread" FROM "SupportThread" t JOIN "User" u ON u."id"=t."ownerId" LEFT JOIN "Profile" p ON p."userId"=u."id" ORDER BY t."updatedAt" DESC LIMIT 100`;}
}
