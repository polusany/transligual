import {Body,Controller,Get,Param,Post,Req,UseGuards} from '@nestjs/common';
import {UserRole} from '@prisma/client';
import {AuthenticatedRequest,JwtAuthGuard} from '../auth/jwt-auth.guard';
import {RolesGuard} from '../auth/roles.guard';
import {Roles} from '../auth/roles.decorator';
import {AssessmentsService} from './assessments.service';
import {AssessmentDto,SubmissionDto} from './dto';
@Controller()
@UseGuards(JwtAuthGuard,RolesGuard)
export class AssessmentsController {
 constructor(private readonly service:AssessmentsService){}
 @Post('courses/:courseId/assessments') @Roles(UserRole.TUTOR,UserRole.ADMIN,UserRole.SUPER_ADMIN)
 author(@Param('courseId') id:string,@Req() r:AuthenticatedRequest,@Body() body:AssessmentDto){return this.service.author(id,r.user.sub,r.user.roles,body);}
 @Get('courses/:courseId/assessments') @Roles(UserRole.STUDENT)
 list(@Param('courseId') id:string,@Req() r:AuthenticatedRequest){return this.service.list(id,r.user.sub);}
 @Post('assessments/:id/start') @Roles(UserRole.STUDENT)
 start(@Param('id') id:string,@Req() r:AuthenticatedRequest){return this.service.start(id,r.user.sub);}
 @Post('assessment-attempts/:id/submit') @Roles(UserRole.STUDENT)
 submit(@Param('id') id:string,@Req() r:AuthenticatedRequest,@Body() body:SubmissionDto){return this.service.submit(id,r.user.sub,body);}
}
