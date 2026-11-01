import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * Paso 3 de ADR-0005 (Línea 51): Validación exhaustiva de esquema con class-validator
 * para neutralizar vectores de SQL Injection (OWASP A03) y Mass Assignment en la entrada.
 */
export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'EMPLOYEE_CODE_REQUIRED' })
  @IsString()
  @MaxLength(25, { message: 'El código no puede exceder 25 caracteres.' })
  @Matches(/^[A-Za-z0-9\-_]+$/, {
    message:
      'El código solo permite caracteres alfanuméricos y guiones (prevención de inyección OWASP A03).',
  })
  code: string;

  @IsNotEmpty({ message: 'EMPLOYEE_NAME_REQUIRED' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  @Matches(/^[^;'"\\<>]+$/, {
    message:
      'El nombre contiene caracteres no permitidos por la política anti-inyección (ADR-0005).',
  })
  name: string;

  @IsNotEmpty({ message: 'EMPLOYEE_EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'EMPLOYEE_EMAIL_INVALID' })
  @MaxLength(120, { message: 'El correo no puede exceder 120 caracteres.' })
  email: string;
}
