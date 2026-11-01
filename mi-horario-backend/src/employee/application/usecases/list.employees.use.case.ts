import { Inject, Injectable } from '@nestjs/common';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';

@Injectable()
export class ListEmployeesUseCase {
  constructor(
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(): Promise<EmployeeEntity[]> {
    return await this.employeeRepository.findAll();
  }
}