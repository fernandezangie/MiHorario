import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';

export interface IEmployeeRepository {
  save(employee: EmployeeEntity): Promise<EmployeeEntity>;
  findByEmail(email: string): Promise<EmployeeEntity | null>;
}

export const IEmployeeRepository = Symbol('IEmployeeRepository');