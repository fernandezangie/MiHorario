import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * DTO de Login blindado según Paso 3 de ADR-0005 (OWASP A03 y bloqueo de Mass Assignment).
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Debe proporcionar un correo o usuario.' })
  @MaxLength(120)
  @Matches(/^[^;'"\\<>]+$/, {
    message: 'El usuario contiene caracteres bloqueados por prevención de inyección.',
  })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'EMPLOYEE'])
  role?: 'ADMIN' | 'EMPLOYEE';
}
