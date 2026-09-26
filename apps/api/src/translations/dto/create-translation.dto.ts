import { TranslationServiceType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTranslationDto {
  @IsString() @MinLength(2) @MaxLength(80) sourceLanguage!: string;
  @IsString() @MinLength(2) @MaxLength(80) targetLanguage!: string;
  @IsEnum(TranslationServiceType) serviceType!: TranslationServiceType;
  @IsOptional() @IsString() @MaxLength(140) documentType?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10000) pageCount?: number;
  @IsOptional() @IsDateString() deadlineAt?: string;
  @IsOptional() @IsString() @MaxLength(5000) instructions?: string;
}
