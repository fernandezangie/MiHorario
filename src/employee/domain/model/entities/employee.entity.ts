import { Entity } from '@shared/domain/entity.base';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';

export class EmployeeEntity extends Entity<string> {
  private code: EmployeeCode;
  private email: EmployeeEmail;
  private status: EmployeeStatus;

  constructor(
    id: string,
    code: EmployeeCode,
    email: EmployeeEmail,
    status: EmployeeStatus,
  ) {
    super(id); // Envía el id a la clase base Entity
    this.code = code;
    this.email = email;
    this.status = status;
  }

  // El getter 'id' ya viene heredado de Entity<string>
  // Si deseas mantener getId() por compatibilidad, puedes conservarlo:
  public getId(): string {
    return this.id;
  }

  public getCode(): EmployeeCode {
    return this.code;
  }

  public getEmail(): EmployeeEmail {
    return this.email;
  }

  public getStatus(): EmployeeStatus {
    return this.status;
  }

  // Métodos de negocio y comportamiento del dominio
  public updateEmail(newEmail: EmployeeEmail): void {
    if (!newEmail) {
      throw new Error('El nuevo correo no puede ser nulo.');
    }
    this.email = newEmail;
  }

  public changeStatus(newStatus: EmployeeStatus): void {
    this.status = newStatus;
  }
}