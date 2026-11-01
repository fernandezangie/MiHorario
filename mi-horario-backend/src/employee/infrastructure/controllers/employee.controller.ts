import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list-employees.use-case';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';
import { Roles } from '@shared/infrastructure/security/roles.decorator';

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
  ) {}

  @Roles('ADMIN')
  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    return await this.createEmployeeUseCase.execute(dto);
  }

  @Roles('ADMIN', 'EMPLOYEE')
  @Get()
  async findAll(@Req() req: any) {
    const allEmployees = await this.listEmployeesUseCase.execute();
    // Cumplimiento Ley 1581 Habeas Data (ADR-0006): si el rol es EMPLOYEE, filtra su propio registro
    if (req?.user?.role === 'EMPLOYEE' && Array.isArray(allEmployees)) {
      return allEmployees.filter((emp: any) => {
        const code = emp.code?.value ?? emp.code;
        return code === req.user.code;
      });
    }
    return allEmployees;
  }
}
