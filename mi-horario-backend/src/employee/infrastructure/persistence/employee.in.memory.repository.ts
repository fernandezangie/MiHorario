import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';

export class EmployeeInMemoryRepository implements EmployeeRepositoryPort {
  private employees: EmployeeEntity[] = [];

  async save(employee: EmployeeEntity): Promise<void> {
    const index = this.employees.findIndex((emp) => emp.getId() === employee.getId());
    if (index !== -1) {
      this.employees[index] = employee; // Actualiza si ya existe (Upsert)
    } else {
      this.employees.push(employee); // Inserta si es nuevo
    }
  }

  async findById(id: string): Promise<EmployeeEntity | null> {
    const employee = this.employees.find((emp) => emp.getId() === id);
    return employee || null;
  }

  async findByEmail(email: string): Promise<EmployeeEntity | null> {
    const employee = this.employees.find(
      (emp) => emp.getEmail().getValue() === email,
    );
    return employee || null;
  }

  async findAll(): Promise<EmployeeEntity[]> {
    return this.employees;
  }
}