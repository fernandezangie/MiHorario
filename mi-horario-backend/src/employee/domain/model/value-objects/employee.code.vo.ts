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

    const codeRegex = /^[A-Z0-9][A-Z0-9-]{3,}$/;
    if (!codeRegex.test(code)) {

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
