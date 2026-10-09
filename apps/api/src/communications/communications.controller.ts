import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ResignationDto, ReviewResignationDto, SupportMessageDto } from './communications.dto';
import { CommunicationsService } from './communications.service';
@Controller('tutors/resignations')
@UseGuards(JwtAuthGuard,RolesGuard)
export class TutorResignationsController {
 constructor(private readonly communications:CommunicationsService){}
 @Get('me') mine(@Req() req:AuthenticatedRequest){return this.communications.myResignations(req.user.sub);}
 @Post() @Roles(UserRole.TUTOR) submit(@Req() req:AuthenticatedRequest,@Body() body:ResignationDto){return this.communications.submitResignation(req.user.sub,body);}
}
@Controller('support/chat')
@UseGuards(JwtAuthGuard)
export class SupportChatController {
 constructor(private readonly communications:CommunicationsService){}
 @Get('me') mine(@Req() req:AuthenticatedRequest){return this.communications.getChat(req.user.sub);}
 @Post('messages') send(@Req() req:AuthenticatedRequest,@Body() body:SupportMessageDto){return this.communications.sendMessage(req.user.sub,body.body);}
}
@Controller('admin')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
export class AdminCommunicationsController {
 constructor(private readonly communications:CommunicationsService){}
 @Get('resignations') resignations(){return this.communications.listResignations();}
 @Post('resignations/:id/review') review(@Param('id') id:string,@Req() req:AuthenticatedRequest,@Body() body:ReviewResignationDto){return this.communications.reviewResignation(id,req.user.sub,body);}
 @Get('support') chats(){return this.communications.listChats();}
 @Get('support/:id') chat(@Param('id') id:string,@Req() req:AuthenticatedRequest){return this.communications.readThread(id,req.user.sub,true);}
 @Post('support/:id/messages') reply(@Param('id') id:string,@Req() req:AuthenticatedRequest,@Body() body:SupportMessageDto){return this.communications.sendMessage(req.user.sub,body.body,id);}
}
