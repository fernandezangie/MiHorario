import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list.employees.use.case';
import { CreateEmployeeDto } from '@employee/application/dtos/create.employee.dto';
import { Roles } from '@shared/infrastructure/security/roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Controller('employees')
export class EmployeeController {
  constructor(
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly listEmployeesUseCase: ListEmployeesUseCase,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  @Roles('ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEmployeeDto) {
    await this.createEmployeeUseCase.execute(dto);

    // Obtenemos la llave traducida desde Redis de forma asíncrona usando await
    const messageKey = await this.messageCatalogService.getMessage(
      'EMPLOYEE_REGISTER_SUCCESS',
      'es',
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: messageKey, //
    };
  }

  @Roles('ADMIN', 'EMPLOYEE')
  @Get()
  async findAll(@Req() req: any) {
    const allEmployees = await this.listEmployeesUseCase.execute();

    if (req?.user?.role === 'EMPLOYEE' && Array.isArray(allEmployees)) {
      return allEmployees.filter((emp: any) => {
        const code = emp.code?.value ?? emp.code;
        return code === req.user.code;
      });
    }
    return allEmployees;
  }
}
