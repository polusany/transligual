import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { RateLimitService } from '../common/rate-limit.service';
import { CommunicationsService } from './communications.service';
import { AdminCommunicationsController, SupportChatController, TutorResignationsController } from './communications.controller';
@Module({imports:[AuthModule],controllers:[AdminCommunicationsController,SupportChatController,TutorResignationsController],providers:[PrismaService,RateLimitService,CommunicationsService]})
export class CommunicationsModule {}
