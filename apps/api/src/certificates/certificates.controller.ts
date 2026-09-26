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
