import { IsEmail, Matches, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) @Matches(/^(?=.*[a-z])(?=.*[A-Z])[\s\S]+$/, { message: 'Use at least 8 characters with an uppercase and a lowercase letter.' }) password!: string;
  @IsString() @MinLength(1) @MaxLength(100) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(100) lastName!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
