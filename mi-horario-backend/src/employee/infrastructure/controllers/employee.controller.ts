import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list-employees.use-case';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    return await this.createEmployeeUseCase.execute(dto);
  }

  @Get()
  async findAll() {
    return await this.listEmployeesUseCase.execute();
  }
}