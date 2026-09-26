import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateModuleDto {
  @IsString() @MinLength(2) @MaxLength(140)
  title!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;
}
