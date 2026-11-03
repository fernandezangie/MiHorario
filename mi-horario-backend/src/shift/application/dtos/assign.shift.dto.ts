import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';

export class AssignShiftDto {
  @IsString()
  @IsOptional() // O IsNotEmpty() si la interfaz del supervisor siempre envía el ID del turno
  id?: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
