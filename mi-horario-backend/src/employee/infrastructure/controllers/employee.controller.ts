import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list.employees.use.case';
import { CreateEmployeeDto } from '@employee/application/dtos/create.employee.dto';

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto) {
    await this.createEmployeeUseCase.execute(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Empleado registrado y notificación enviada con éxito.',
    };
  }

  @Get()
  async findAll() {
    return await this.listEmployeesUseCase.execute();
  }
}
