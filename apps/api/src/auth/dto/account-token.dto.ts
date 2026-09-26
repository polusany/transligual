import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class EmailDto {
  @IsEmail() email!: string;
}

export class AccountTokenDto {
  @IsString() @MinLength(32) @MaxLength(200) token!: string;
}

export class PasswordResetDto extends AccountTokenDto {
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
