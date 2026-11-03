import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateZoneDto {
  @IsNotEmpty({ message: 'ZONE_NAME_REQUIRED' })
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location: string;
}
