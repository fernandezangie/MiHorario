import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateRestrictionUseCase } from '@restriction/application/use-cases/create-restriction.use-case';
import { FindRestrictionsByEmployeeUseCase } from '@restriction/application/use-cases/find-restrictions-by-employee.use-case';
import { CreateRestrictionDto } from '@restriction/application/dtos/create-restriction.dto';

@Controller('restriction')
export class RestrictionController {
  constructor(
    private readonly createRestrictionUseCase: CreateRestrictionUseCase,
    private readonly findRestrictionsByEmployeeUseCase: FindRestrictionsByEmployeeUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateRestrictionDto) {
    await this.createRestrictionUseCase.execute(dto);
    return {
      statusCode: 201,
      message: 'Restricción registrada exitosamente',
    };
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string) {
    return await this.findRestrictionsByEmployeeUseCase.execute(employeeId);
  }
}