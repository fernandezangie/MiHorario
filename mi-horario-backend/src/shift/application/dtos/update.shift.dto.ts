import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateShiftDto {
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
}
