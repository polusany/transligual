import { Transform } from 'class-transformer';
import { IsIn, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class LearnerRegistrationDto {
  @Transform(trim) @IsString() @Length(2, 120)
  fullName!: string;

  @Transform(trim) @IsString() @Length(7, 30) @Matches(/^\+?[0-9 ()-]+$/)
  phone!: string;

  @IsIn(['beginner', 'intermediate', 'advanced', 'specialized-tutoring', 'research-assistance'])
  program!: string;

  @IsIn(['none', 'beginner', 'intermediate', 'advanced'])
  frenchLevel!: string;

  @Transform(trim) @IsString() @Length(10, 2000)
  goals!: string;
}
