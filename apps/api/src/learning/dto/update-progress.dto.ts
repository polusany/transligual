import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsNumber() @Min(0) @Max(100)
  progressPercentage!: number;

  @IsInt() @Min(0)
  lastPositionSeconds!: number;
}
