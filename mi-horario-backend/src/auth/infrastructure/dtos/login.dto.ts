import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'LOGIN_EMAIL_REQUIRED' }) //
  @MaxLength(120)
  @Matches(/^[^;'"\\<>]+$/, {
    message: 'LOGIN_EMAIL_INVALID_CHARS', //
  })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'LOGIN_PASSWORD_REQUIRED' }) //
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'EMPLOYEE'])
  role?: 'ADMIN' | 'EMPLOYEE';
}
