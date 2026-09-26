import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class TranslateTextDto {
  @IsString() @MinLength(1) @MaxLength(5000)
  text!: string;

  @IsString() @Matches(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/)
  targetLanguage!: string;

  @IsOptional() @IsString() @Matches(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/)
  sourceLanguage?: string;
}
