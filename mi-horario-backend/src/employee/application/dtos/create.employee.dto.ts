import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'EMPLOYEE_CODE_REQUIRED' })
  @IsString()
  @MaxLength(25, { message: 'EMPLOYEE_CODE_MAX_LENGTH' })
  @Matches(/^[A-Za-z0-9\-_]+$/, {
    message: 'EMPLOYEE_CODE_INVALID_FORMAT',
  })
  code: string;

  @IsNotEmpty({ message: 'EMPLOYEE_NAME_REQUIRED' })
  @IsString()
  @MaxLength(100, { message: 'EMPLOYEE_NAME_MAX_LENGTH' })
  @Matches(/^[^;'"\\<>]+$/, {
    message: 'EMPLOYEE_NAME_INVALID_CHARS',
  })
  name: string;

  @IsNotEmpty({ message: 'EMPLOYEE_EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'EMPLOYEE_EMAIL_INVALID' })
  @MaxLength(120, { message: 'EMPLOYEE_EMAIL_MAX_LENGTH' })
  email: string;
}
