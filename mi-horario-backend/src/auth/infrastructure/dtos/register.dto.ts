import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {

  @ValidateIf((o) => o.role === 'ADMIN')
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'REGISTER_NAME_REQUIRED' })
  @MaxLength(120)
  @Matches(/^[^;'"\\<>]+$/, {
    message: 'REGISTER_NAME_INVALID_CHARS',
  })
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'REGISTER_EMAIL_INVALID' })
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(8, { message: 'REGISTER_PASSWORD_MIN_LENGTH' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'REGISTER_PASSWORD_COMPLEXITY',
  })
  password: string;

  @IsIn(['ADMIN', 'EMPLOYEE'], {
    message: 'REGISTER_ROLE_INVALID',
  })
  role: 'ADMIN' | 'EMPLOYEE';

  @ValidateIf((o) => o.role === 'EMPLOYEE')
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'REGISTER_CODE_REQUIRED' })
  @Matches(/^[A-Z0-9][A-Z0-9-]{3,24}$/, {
    message: 'REGISTER_CODE_INVALID_FORMAT',
  })
  code?: string;

  @ValidateIf((o) => o.role === 'ADMIN')
  @IsString()
  @IsNotEmpty({ message: 'REGISTER_REGISTRATION_KEY_REQUIRED' })
  @MaxLength(128)
  registrationKey?: string;
}