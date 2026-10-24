export class EmployeeCode {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('El código del empleado es obligatorio.');
    }
    // Ejemplo de regla: el código debe tener al menos 4 caracteres alfanuméricos
    const codeRegex = /^[A-Z0-9]{4,}$/;
    if (!codeRegex.test(code)) {
      throw new Error(`El código "${code}" debe tener al menos 4 caracteres en mayúscula y/o números.`);
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