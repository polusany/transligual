import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma.service';
@Injectable()
export class RateLimitService {
 constructor(private readonly prisma:PrismaService){}
 async consume(key:string,limit:number,windowMs:number,amount=1) {
  const hashed=createHash('sha256').update(key).digest('hex');
  const rows=await this.prisma.$queryRaw<{count:number}[]>`
   INSERT INTO "RateLimitBucket" ("key","count","resetAt") VALUES (${hashed},${amount},NOW()+${windowMs}*INTERVAL '1 millisecond')
   ON CONFLICT ("key") DO UPDATE SET
    "count"=CASE WHEN "RateLimitBucket"."resetAt"<=NOW() THEN ${amount} ELSE "RateLimitBucket"."count"+${amount} END,
    "resetAt"=CASE WHEN "RateLimitBucket"."resetAt"<=NOW() THEN NOW()+${windowMs}*INTERVAL '1 millisecond' ELSE "RateLimitBucket"."resetAt" END
   RETURNING "count"`;
  if(Math.random()<0.01) await this.prisma.rateLimitBucket.deleteMany({where:{resetAt:{lt:new Date()}}});
  if(rows[0].count>limit) throw new HttpException('Request limit reached. Please try again later.',HttpStatus.TOO_MANY_REQUESTS);
 }
}
export function clientAddress(request:{headers:Record<string,string|string[]|undefined>;ip?:string;socket?:{remoteAddress?:string}}) {
 // Production API is private; the public reverse proxy must overwrite X-Forwarded-For.
 const forwarded=request.headers['x-forwarded-for'];
 return (process.env.NODE_ENV==='production' ? (Array.isArray(forwarded)?forwarded[0]:forwarded)?.split(',')[0]?.trim():undefined) || request.ip || request.socket?.remoteAddress || 'unknown';
}
