import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
export class AccountsQueryDto {
 @IsOptional() @IsString() @MaxLength(120) search?: string;
 @IsOptional() @IsIn(['registered', 'removed']) view?: 'registered' | 'removed';
 @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page?: number;
}
