import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module';
import {CertificatesModule} from '../certificates/certificates.module';
import {PrismaService} from '../prisma.service';
import {AssessmentsService} from './assessments.service';
import {AssessmentsController} from './assessments.controller';
@Module({imports:[AuthModule,CertificatesModule],controllers:[AssessmentsController],providers:[AssessmentsService,PrismaService]})
export class AssessmentsModule {}
