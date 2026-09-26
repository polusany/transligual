import { CourseLevel } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsString() @MinLength(3) @MaxLength(140)
  title!: string;

  @IsString() @MinLength(10) @MaxLength(160)
  shortDescription!: string;

  @IsString() @MinLength(30) @MaxLength(12000)
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsEnum(CourseLevel)
  level!: CourseLevel;

  @IsString() @Matches(/^\d{1,15}$/)
  priceMinor!: string;

  @IsString() @Matches(/^[A-Za-z]{3}$/)
  currency!: string;

  @IsOptional() @IsBoolean()
  certificateEnabled?: boolean;
}
