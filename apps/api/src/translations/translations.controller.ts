import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { TranslationsService } from './translations.service';

@Controller('translations/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class TranslationsController {
  constructor(private readonly translations: TranslationsService) {}
  @Post() create(@Body() body: CreateTranslationDto, @Req() request: AuthenticatedRequest) { return this.translations.createRequest(request.user.sub, body); }
  @Get('me') listMine(@Req() request: AuthenticatedRequest) { return this.translations.listMine(request.user.sub); }
  @Get(':id') findMine(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.translations.findMine(request.user.sub, id); }
}
