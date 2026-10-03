import { IsIn } from 'class-validator';
export class AssignProgramDto {
  @IsIn(['beginner', 'intermediate', 'advanced', ''])
  program!: string;
}
