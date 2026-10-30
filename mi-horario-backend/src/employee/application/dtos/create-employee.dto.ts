import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'EMPLOYEE_CODE_REQUIRED' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'EMPLOYEE_NAME_REQUIRED' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'EMPLOYEE_EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'EMPLOYEE_EMAIL_INVALID' })
  email: string;
}
