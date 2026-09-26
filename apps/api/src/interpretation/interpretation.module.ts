import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { InterpretationController } from './interpretation.controller';
import { InterpretationService } from './interpretation.service';

@Module({ imports: [AuthModule], controllers: [InterpretationController], providers: [InterpretationService, PrismaService] })
export class InterpretationModule {}
