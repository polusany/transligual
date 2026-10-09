import { IsEmail, Matches, IsString, MaxLength, MinLength } from 'class-validator';

export class EmailDto {
  @IsEmail() email!: string;
}

export class AccountTokenDto {
  @IsString() @MinLength(32) @MaxLength(200) token!: string;
}

export class PasswordResetDto extends AccountTokenDto {
  @IsString() @MinLength(8) @MaxLength(128) @Matches(/^(?=.*[a-z])(?=.*[A-Z])[\s\S]+$/, { message: 'Use at least 8 characters with an uppercase and a lowercase letter.' }) password!: string;
}
