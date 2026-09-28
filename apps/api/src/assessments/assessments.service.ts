import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CertificatesService } from '../certificates/certificates.service';
import { AssessmentDto, SubmissionDto } from './dto';
import { grade, Question } from './grading';
@Injectable()
export class AssessmentsService {
 constructor(private readonly prisma:PrismaService, private readonly certificates:CertificatesService) {}
 async author(courseId:string,userId:string,roles:string[], input:AssessmentDto) {
  const course=await this.prisma.course.findUnique({where:{id:courseId}});
  if(!course) throw new NotFoundException('Course not found.');
  if(!roles.some(r=>['ADMIN','SUPER_ADMIN'].includes(r)) && course.tutorId!==userId) throw new ForbiddenException();
  if(course.status!=='DRAFT') throw new BadRequestException('Assessments can only be authored while the course is a draft.');
  if(input.lessonId && !await this.prisma.lesson.findFirst({where:{id:input.lessonId,module:{courseId},lessonType:'QUIZ'}})) throw new BadRequestException('Choose a quiz lesson in this course.');
  for(const q of input.questions) if(q.correct.some(i=>i>=q.options.length) || new Set(q.correct).size!==q.correct.length || q.options.some(o=>!o.trim()) || !q.text.trim()) throw new BadRequestException('Check the question options and correct answers.');
  return this.prisma.assessment.create({data:{courseId,lessonId:input.lessonId || null,title:input.title.trim(),passPercentage:input.passPercentage,maxAttempts:input.maxAttempts,durationMinutes:input.durationMinutes,isPublished:input.isPublished,questions:input.questions.map(q=>({text:q.text,options:q.options,correct:q.correct,points:q.points}))}});
 }
 async list(courseId:string,studentId:string) {
  await this.enrolled(courseId,studentId);
  const rows=await this.prisma.assessment.findMany({where:{courseId,isPublished:true},include:{attempts:{where:{studentId},select:{id:true,percentage:true,passed:true,startedAt:true,submittedAt:true}}}});
  return rows.map(({questions,...row})=>({...row,questions:row.attempts.length ? (questions as Question[]).map(({correct,...q})=>q) : []}));
 }
 private async enrolled(courseId:string,studentId:string) {
  if(!await this.prisma.enrollment.findFirst({where:{courseId,studentId,status:{in:['ACTIVE','COMPLETED']}}})) throw new ForbiddenException('Enroll in this course to take its assessments.');
 }
 async start(id:string,studentId:string) {
  return this.prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${studentId+':'+id}))`;
   const assessment=await tx.assessment.findUnique({where:{id}});
   if(!assessment?.isPublished) throw new NotFoundException('Assessment not found.');
   await this.enrolled(assessment.courseId,studentId);
   const attempts=await tx.assessmentAttempt.findMany({where:{assessmentId:id,studentId},orderBy:{startedAt:'desc'}});
   const open=attempts.find(a=>!a.submittedAt);
   if(open) return {id:open.id,startedAt:open.startedAt,durationMinutes:assessment.durationMinutes};
   if(attempts.length>=assessment.maxAttempts) throw new BadRequestException('You have used all attempts for this assessment.');
   const attempt=await tx.assessmentAttempt.create({data:{assessmentId:id,studentId}});
   return {id:attempt.id,startedAt:attempt.startedAt,durationMinutes:assessment.durationMinutes};
  });
 }
 async submit(id:string,studentId:string,input:SubmissionDto) {
  const result=await this.prisma.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
   const attempt=await tx.assessmentAttempt.findFirst({where:{id,studentId},include:{assessment:true}});
   if(!attempt) throw new NotFoundException('Attempt not found.');
   await this.enrolled(attempt.assessment.courseId,studentId);
   if(attempt.submittedAt) return attempt;
   let score; try{score=grade(attempt.assessment.questions as Question[],input.answers);}catch{throw new BadRequestException('Invalid answers.');}
   const expired=attempt.assessment.durationMinutes!==null && Date.now()>attempt.startedAt.getTime()+attempt.assessment.durationMinutes*60000;
   return tx.assessmentAttempt.update({where:{id},data:{score:expired?0:score.score,percentage:expired?0:score.percentage,passed:!expired&&score.percentage>=attempt.assessment.passPercentage,submittedAt:new Date()},include:{assessment:true}});
  });
  await this.certificates.issueIfEligible(studentId,result.assessment.courseId);
  return {id:result.id,score:result.score,percentage:result.percentage,passed:result.passed,submittedAt:result.submittedAt};
 }
}
