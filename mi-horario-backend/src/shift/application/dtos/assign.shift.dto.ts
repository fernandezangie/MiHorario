import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class AssignShiftDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
