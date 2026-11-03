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

/**
 * DTO de registro. Rechaza cualquier campo que no esté declarado aquí (whitelist).
 */
export class RegisterDto {
  /** Obligatorio para supervisores. Los colaboradores usan el nombre de su registro. */
  @ValidateIf((o) => o.role === 'ADMIN')
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120)
  @Matches(/^[^;'"\\<>]+$/, {
    message:
      'El nombre contiene caracteres bloqueados por prevención de inyección.',
  })
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe combinar letras y números.',
  })
  password: string;

  @IsIn(['ADMIN', 'EMPLOYEE'], {
    message: 'El perfil debe ser ADMIN o EMPLOYEE.',
  })
  role: 'ADMIN' | 'EMPLOYEE';

  /** Código de nómina: obligatorio para colaboradores (debe existir en "employees"). */
  @ValidateIf((o) => o.role === 'EMPLOYEE')
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'El código de colaborador es obligatorio.' })
  @Matches(/^[A-Z0-9][A-Z0-9-]{3,24}$/, {
    message: 'El código solo admite letras, números y guiones (mínimo 4).',
  })
  code?: string;

  /** Clave de registro de supervisores (la define el servidor). */
  @ValidateIf((o) => o.role === 'ADMIN')
  @IsString()
  @IsNotEmpty({ message: 'La clave de registro de supervisor es obligatoria.' })
  @MaxLength(128)
  registrationKey?: string;
}
