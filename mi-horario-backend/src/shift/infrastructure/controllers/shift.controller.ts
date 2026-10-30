import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CreateShiftUseCase } from '@shift/application/use-cases/create-shift.use-case';
import { FindShiftByIdUseCase } from '@shift/application/use-cases/find-shift-by-id.use-case';
import { ListShiftsUseCase } from '@shift/application/use-cases/list-shifts.use-case';
import { CreateShiftDto } from '@shift/application/dtos/create-shift.dto';

@Controller('shift')
export class ShiftController {
  constructor(
    private readonly createShiftUseCase: CreateShiftUseCase,
    private readonly findShiftByIdUseCase: FindShiftByIdUseCase,
    private readonly listShiftsUseCase: ListShiftsUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateShiftDto) {
    await this.createShiftUseCase.execute(dto);
    return {
      statusCode: 201,
      message: 'SHIFT_CREATE',
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