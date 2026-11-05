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
import { UpdateShiftUseCase } from '@shift/application/usecases/update.shift.use.case';
import { AssignShiftDto } from '@shift/application/dtos/assign.shift.dto';
import { UpdateShiftDto } from '@shift/application/dtos/update.shift.dto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt.auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shift')
export class ShiftController {
  constructor(
    private readonly assignShiftUseCase: AssignShiftToEmployeeUseCase,
    private readonly findShiftByIdUseCase: FindShiftByIdUseCase,
    private readonly listShiftsUseCase: ListShiftsUseCase,
    private readonly acknowledgeShiftUseCase: AcknowledgeShiftUseCase,
    private readonly updateShiftUseCase: UpdateShiftUseCase,
    private readonly messageCatalogService: MessageCatalogService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: AssignShiftDto) {
    await this.assignShiftUseCase.execute(dto);
    const message = await this.messageCatalogService.getMessage(
      'SHIFT_ASSIGN_SUCCESS',
      'es',
    );
    return {
      statusCode: HttpStatus.CREATED,
      message,
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
    const message = await this.messageCatalogService.getMessage(
      'SHIFT_ACKNOWLEDGE_SUCCESS',
      'es',
    );
    return {
      statusCode: HttpStatus.OK,
      message,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    await this.updateShiftUseCase.execute(id, dto);
    const message = await this.messageCatalogService.getMessage(
      'SHIFT_UPDATE_SUCCESS',
      'es',
    );
    return {
      statusCode: HttpStatus.OK,
      message,
    };
  }
}
