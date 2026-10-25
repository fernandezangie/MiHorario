export class EmployeeName {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('El nombre del empleado es obligatorio.');
    }
    if (value.trim().length < 2) {
      throw new Error('El nombre del empleado debe tener al menos 2 caracteres.');
    }
  }

  public getValue(): string {
    return this.value;
  }
}