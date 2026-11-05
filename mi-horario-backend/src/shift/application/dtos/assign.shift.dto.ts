import { IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class AssignShiftDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  // asignar prueba

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isRest?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  jobId?: string; //
}
