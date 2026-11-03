import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AssignShiftToEmployeeUseCase } from '@shift/application/usecases/assign.shift.to.employee.use.case';
import { FindShiftByIdUseCase } from '@shift/application/usecases/find.shift.by.id.use.case';
import { ListShiftsUseCase } from '@shift/application/usecases/list.shifts.use.case';
import { AcknowledgeShiftUseCase } from '@shift/application/usecases/acknowledge.shift.use.case';
import { UpdateShiftUseCase } from '@shift/application/usecases/update.shift.use.case'; // Importa tu caso de uso de actualización
import { AssignShiftDto } from '@shift/application/dtos/assign.shift.dto';
import { UpdateShiftDto } from '@shift/application/dtos/update.shift.dto'; // Importa el DTO para actualización

@Controller('shift')
export class ShiftController {
  constructor(
    private readonly assignShiftUseCase: AssignShiftToEmployeeUseCase,
    private readonly findShiftByIdUseCase: FindShiftByIdUseCase,
    private readonly listShiftsUseCase: ListShiftsUseCase,
    private readonly acknowledgeShiftUseCase: AcknowledgeShiftUseCase,
    private readonly updateShiftUseCase: UpdateShiftUseCase, // Inyectado para persistir los cambios del supervisor
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

  @Patch(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  async acknowledge(@Param('id') id: string) {
    await this.acknowledgeShiftUseCase.execute(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Turno confirmado exitosamente por el colaborador.',
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    await this.updateShiftUseCase.execute(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Turno actualizado y sincronizado con éxito.',
    };
  }
}
