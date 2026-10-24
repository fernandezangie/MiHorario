import { Injectable } from '@nestjs/common';
import { IEmployeeRepository } from '@employee/domain/ports/employee.repository.port';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';

@Injectable()
export class EmployeeInMemoryRepository implements IEmployeeRepository {
  private employees: EmployeeEntity[] = [];

  async save(employee: EmployeeEntity): Promise<EmployeeEntity> {
    this.employees.push(employee);
    return employee;
  }

  async findByEmail(email: string): Promise<EmployeeEntity | null> {
    const found = this.employees.find((e) => e.getEmail() === email);
    return found || null;
  }
}