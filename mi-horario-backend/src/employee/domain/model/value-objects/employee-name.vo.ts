export class EmployeeName {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value.trim();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('EMPLOYEE_NAME_REQUIRED');
    }
    if (value.trim().length < 2) {
      throw new Error('EMPLOYEE_NAME_MIN_LENGTH');
    }
  }

  public getValue(): string {
    return this.value;
  }
}
