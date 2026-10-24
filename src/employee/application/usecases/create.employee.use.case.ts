import { Inject, Injectable } from '@nestjs/common';
import { IEmployeeRepository } from '@employee/domain/ports/employee.repository.port';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(IEmployeeRepository)
    private readonly employeeRepository: IEmployeeRepository,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const employee = new EmployeeEntity(
      Date.now().toString(),
      dto.name,
      dto.email,
    );
    return await this.employeeRepository.save(employee);
  }
}