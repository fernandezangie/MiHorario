import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignShiftToEmployeeUseCase } from '@shift/application/usecases/assign.shift.to.employee.use.case'; // <-- Usando el caso de uso con notificaciones y caché
import { FindShiftByIdUseCase } from '@shift/application/usecases/find.shift.by.id.use.case';
import { ListShiftsUseCase } from '@shift/application/usecases/list.shifts.use.case';
import { AssignShiftDto } from '@shift/application/dtos/assign.shift.dto'; // <-- DTO correspondiente

@Controller('shift')
export class ShiftController {
  constructor(
    private readonly assignShiftUseCase: AssignShiftToEmployeeUseCase,
    private readonly findShiftByIdUseCase: FindShiftByIdUseCase,
    private readonly listShiftsUseCase: ListShiftsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: AssignShiftDto) {
    await this.assignShiftUseCase.execute(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Turno asignado y notificación enviada con éxito.',
    };
  }

  @Get()
  async findAll() {
    return await this.listShiftsUseCase.execute();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.findShiftByIdUseCase.execute(id);
  }
}