import { Body, Controller, Post } from '@nestjs/common';
import { CreateEmployeeUseCase } from '@employee/application/use-cases/create-employee.use-case';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase) {}

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    return await this.createEmployeeUseCase.execute(dto);
  }
}