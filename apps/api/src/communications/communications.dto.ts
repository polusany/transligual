import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsDateString, IsIn, IsString, Length, Matches } from 'class-validator';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
export class ResignationDto {
 @IsDateString() @Matches(/^\d{4}-\d{2}-\d{2}$/) lastTeachingDate!: string;
 @Transform(trim) @IsString() @Length(30,5000) letter!: string;
 @Transform(trim) @IsString() @Length(2,120) signedName!: string;
 @IsBoolean() @Equals(true) confirmed!: boolean;
}
export class ReviewResignationDto {
 @IsIn(['APPROVED','DECLINED']) decision!: 'APPROVED'|'DECLINED';
 @Transform(trim) @IsString() @Length(5,2000) notes!: string;
}
export class SupportMessageDto {
 @Transform(trim) @IsString() @Length(1,2000) body!: string;
}
