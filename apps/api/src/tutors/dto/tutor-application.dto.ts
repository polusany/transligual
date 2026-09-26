import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class TutorApplicationDto {
  @IsString() @MinLength(8) @MaxLength(140)
  headline!: string;

  @IsString() @MinLength(40) @MaxLength(5000)
  biography!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  qualifications?: string;

  @IsOptional() @IsInt() @Min(0) @Max(60)
  yearsExperience?: number;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(12)
  @IsString({ each: true })
  languages!: string[];
}
