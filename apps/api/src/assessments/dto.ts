import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
export class QuestionDto {
 @IsString() @MinLength(2) @MaxLength(2000) text!: string;
 @IsArray() @ArrayMinSize(2) @ArrayMaxSize(8) @IsString({each:true}) @MaxLength(500,{each:true}) options!: string[];
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(8) @IsInt({each:true}) @Min(0,{each:true}) correct!: number[];
 @IsInt() @Min(1) @Max(100) points!: number;
}
export class AssessmentDto {
 @IsString() @MinLength(2) @MaxLength(140) title!: string;
 @IsOptional() @IsString() lessonId?: string;
 @IsInt() @Min(1) @Max(100) passPercentage!: number;
 @IsInt() @Min(1) @Max(20) maxAttempts!: number;
 @IsOptional() @IsInt() @Min(1) @Max(240) durationMinutes?: number;
 @IsBoolean() isPublished!: boolean;
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>QuestionDto) questions!: QuestionDto[];
}
export class AnswerDto {
 @IsInt() @Min(0) question!: number;
 @IsArray() @ArrayMaxSize(8) @IsInt({each:true}) @Min(0,{each:true}) selected!: number[];
}
export class SubmissionDto {
 @IsArray() @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>AnswerDto) answers!: AnswerDto[];
}
