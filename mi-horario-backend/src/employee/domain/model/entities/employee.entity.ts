import { Entity } from '@shared/domain/entity.base';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';
import { EmployeeName } from '../value-objects/employee-name.vo';

export class EmployeeEntity extends Entity<string> {
  private code: EmployeeCode;
  private email: EmployeeEmail;
  private status: EmployeeStatus;
  private name: EmployeeName;

  constructor(
    id: string,
    code: EmployeeCode,
    name: EmployeeName,
    email: EmployeeEmail,
    status: EmployeeStatus,
  ) {
    super(id);
    this.code = code;
    this.name = name;
    this.email = email;
    this.status = status;
  }

  public getId(): string {
    return this.id;
  }

  public getCode(): EmployeeCode {
    return this.code;
  }

  public getName(): EmployeeName {
    return this.name;
  }

  public getEmail(): EmployeeEmail {
    return this.email;
  }

  public getStatus(): EmployeeStatus {
    return this.status;
  }

  public updateEmail(newEmail: EmployeeEmail): void {
    if (!newEmail) {
      // Usamos un código de error o excepción estándar limpia
      throw new Error('EMPLOYEE_EMAIL_NULL_ERROR');
    }
    this.email = newEmail;
  }

  public changeStatus(newStatus: EmployeeStatus): void {
    this.status = newStatus;
  }
}
