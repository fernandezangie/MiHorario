import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';
import {Inject} from "@nestjs/common";

export class CreateEmployeeUseCase {
  constructor(
  @Inject('EmployeeRepositoryPort')
  private readonly employeeRepository: EmployeeRepositoryPort,
) {}


  async execute(dto: CreateEmployeeDto): Promise<void> {
    const employee = new EmployeeEntity(
      Date.now().toString(),
      new EmployeeCode(dto.code),
      new EmployeeEmail(dto.email),
      EmployeeStatus.ACTIVE
    );

    await this.employeeRepository.save(employee);
  }
}