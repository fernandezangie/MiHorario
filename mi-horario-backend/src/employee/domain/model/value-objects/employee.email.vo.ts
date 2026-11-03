export class EmployeeEmail {
  private readonly value: string;

  constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  private validate(email: string): void {
    if (!email) {
      throw new Error('EMPLOYEE_EMAIL_REQUIRED');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {

      throw new Error(`EMPLOYEE_EMAIL_INVALID_FORMAT`);
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: EmployeeEmail): boolean {
    if (!(other instanceof EmployeeEmail)) {
      return false;
    }
    return this.value === other.value;
  }
}
