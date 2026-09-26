import { InterpretationLocationType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID() serviceId!: string;
  @IsString() @MinLength(2) @MaxLength(80) sourceLanguage!: string;
  @IsString() @MinLength(2) @MaxLength(80) targetLanguage!: string;
  @IsDateString() scheduledStartAt!: string;
  @IsDateString() scheduledEndAt!: string;
  @IsOptional() @IsString() @MaxLength(80) customerTimezone?: string;
  @IsEnum(InterpretationLocationType) locationType!: InterpretationLocationType;
  @IsOptional() @IsString() @MaxLength(1000) locationDetails?: string;
  @IsOptional() @IsString() @MaxLength(3000) eventDetails?: string;
}
