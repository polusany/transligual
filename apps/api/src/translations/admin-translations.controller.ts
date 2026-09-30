import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReplyTranslationDto } from './dto/create-translation.dto';
import { TranslationsService } from './translations.service';

@Controller('admin/translations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminTranslationsController {
  constructor(private readonly translations: TranslationsService) {}
  @Get() list() { return this.translations.listForAdmin(); }
  @Post(':id/reply') reply(@Param('id') id: string, @Body() body: ReplyTranslationDto, @Req() request: AuthenticatedRequest) {
    return this.translations.reply(id, request.user.sub, body);
  }
}
