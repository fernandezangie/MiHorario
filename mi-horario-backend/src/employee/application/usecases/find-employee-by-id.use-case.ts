import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import {Inject} from "@nestjs/common";

export class FindEmployeeByIdUseCase {
    constructor(
  @Inject('EmployeeRepositoryPort')
  private readonly employeeRepository: EmployeeRepositoryPort,
) {}

  async execute(id: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new Error('El empleado no fue encontrado');
    }
    return employee;
  }
}