import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class CreateTranslationDto {
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) sourceLanguage!: string;
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(80) targetLanguage!: string;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(5000) sourceText!: string;
}
export class ReplyTranslationDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(20000) translatedText!: string;
}
