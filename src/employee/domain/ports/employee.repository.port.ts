import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';

export interface EmployeeRepositoryPort {
  save(employee: EmployeeEntity): Promise<void>;
  findById(id: string): Promise<EmployeeEntity | null>;
  findByEmail(email: string): Promise<EmployeeEntity | null>;
  findAll(): Promise<EmployeeEntity[]>;
}