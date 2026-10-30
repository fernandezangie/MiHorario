export class EmployeeCode {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('EMPLOYEE_CODE_REQUIRED');
    }
    // Ejemplo de regla: el código debe tener al menos 4 caracteres alfanuméricos en mayúscula y/o números
    const codeRegex = /^[A-Z0-9]{4,}$/;
    if (!codeRegex.test(code)) {
      // Pasamos el código dinámico usando el identificador o formato esperado
      throw new Error(`EMPLOYEE_CODE_INVALID_FORMAT:${code}`);
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: EmployeeCode): boolean {
    if (!(other instanceof EmployeeCode)) {
      return false;
    }
    return this.value === other.value;
  }
}
