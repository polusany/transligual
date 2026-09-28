import {IsEmail,IsIn,IsOptional,IsString,IsUrl,Matches,MaxLength,MinLength} from 'class-validator';
export class ManageBookingDto {
 @IsIn(['quote','assign','start','deliver','revise','complete','cancel']) action!:string;
 @IsOptional() @IsString() @Matches(/^[1-9]\d{0,11}$/) amountMinor?:string;
 @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) currency?:string;
 @IsOptional() @IsString() interpreterId?:string;
 @IsOptional() @IsUrl({protocols:['https'],require_protocol:true}) @MaxLength(2000) meetingUrl?:string;
 @IsOptional() @IsString() @MinLength(3) @MaxLength(5000) notes?:string;
}

export class ApproveInterpreterDto {
 @IsEmail() email!:string;
 @IsString() @MinLength(3) @MaxLength(2000) qualifications!:string;
 @IsString() @MinLength(3) @MaxLength(500) languagePairs!:string;
}
