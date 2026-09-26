import { LessonType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsString() @MinLength(2) @MaxLength(140)
  title!: string;

  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @IsEnum(LessonType)
  lessonType!: LessonType;

  @IsOptional() @IsBoolean()
  isPreview?: boolean;

  @IsOptional() @IsInt() @Min(1) @Max(600)
  durationMinutes?: number;
}
