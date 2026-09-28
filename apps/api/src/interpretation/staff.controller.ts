import {Body,Controller,Get,Param,Post,Req,UseGuards} from '@nestjs/common';
import {UserRole} from '@prisma/client';
import {AuthenticatedRequest,JwtAuthGuard} from '../auth/jwt-auth.guard';
import {RolesGuard} from '../auth/roles.guard';
import {Roles} from '../auth/roles.decorator';
import {InterpretationService} from './interpretation.service';
import {ManageBookingDto,ApproveInterpreterDto} from './dto/manage-booking.dto';
@Controller('interpretation')
@UseGuards(JwtAuthGuard,RolesGuard)
export class InterpretationStaffController {
 constructor(private readonly service:InterpretationService){}
 @Get('staff/bookings') @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.INTERPRETER)
 list(@Req() r:AuthenticatedRequest){return this.service.listStaff(r.user.sub,r.user.roles);}

 @Post('staff/interpreters') @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
 approve(@Body() body:ApproveInterpreterDto,@Req() r:AuthenticatedRequest){return this.service.approveInterpreter(body,r.user.sub);}
 @Get('staff/interpreters') @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN)
 interpreters(){return this.service.interpreters();}
 @Post('bookings/:id/manage') @Roles(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.INTERPRETER,UserRole.STUDENT)
 manage(@Param('id') id:string,@Req() r:AuthenticatedRequest,@Body() body:ManageBookingDto){return this.service.manage(id,r.user.sub,r.user.roles,body);}
}
