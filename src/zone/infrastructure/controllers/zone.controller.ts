import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateZoneUseCase } from '@zone/application/use-cases/create-zone.use-case';
import { ListZonesUseCase } from '@zone/application/use-cases/list-zones.use-case';
import { CreateZoneDto } from '@zone/application/dtos/create-zone.dto';

@Controller('zone')
export class ZoneController {
  constructor(
    private readonly createZoneUseCase: CreateZoneUseCase,
    private readonly listZonesUseCase: ListZonesUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateZoneDto) {
    await this.createZoneUseCase.execute(dto);
    return {
      statusCode: 201,
      message: 'Zona creada exitosamente',
    };
  }

  @Get()
  async findAll() {
    return await this.listZonesUseCase.execute();
  }
}