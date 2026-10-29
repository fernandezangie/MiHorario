import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty({ message: 'El código del empleado es obligatorio.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'El nombre del empleado es obligatorio.' })
  @IsString()
  name: string; // <-- Asegúrate de que esté definido aquí

  @IsNotEmpty({ message: 'El correo es obligatorio.' })
  @IsEmail({}, { message: 'El formato del correo no es válido.' })
  email: string;
}