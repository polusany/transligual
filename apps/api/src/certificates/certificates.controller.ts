import { certificatePdf } from './certificate-pdf';
import { ForbiddenException, Res } from '@nestjs/common';
import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('verify/:code') verify(@Param('code') code: string) { return this.certificates.verify(code); }

  @Get('me') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STUDENT)
  mine(@Req() req: AuthenticatedRequest) { return this.certificates.listMine(req.user.sub); }


  @Get(':id/pdf') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STUDENT)
  async pdf(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() response: {setHeader:(key:string,value:string)=>void;end:(body:Buffer)=>void}) {
    const c = await this.certificates.findMine(req.user.sub,id);
    if(c.status!=='ACTIVE')throw new ForbiddenException('Only active certificates can be downloaded.');
    const p=c.student.profile;
    const data=await certificatePdf({name:p?.displayName || [p?.firstName,p?.lastName].filter(Boolean).join(' ') || 'Learner',course:c.course.title,number:c.certificateNumber,code:c.verificationCode,issuedAt:c.issuedAt,verificationUrl:(process.env.WEB_APP_URL || 'http://localhost:3000')+'/certificates/verify?code='+c.verificationCode});
    response.setHeader('Content-Type','application/pdf');response.setHeader('Content-Disposition','attachment; filename="certificate-'+c.certificateNumber+'.pdf"');response.setHeader('Cache-Control','private, no-store');response.end(data);
  }

  @Get(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.STUDENT)
  findMine(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.certificates.findMine(req.user.sub, id); }
}

@Controller('admin/certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminCertificatesController {
  constructor(private readonly certificates: CertificatesService) {}
  @Post(':id/revoke') revoke(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.certificates.revoke(id, req.user.sub); }
}
