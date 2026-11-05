import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateZoneUseCase } from '@zone/application/usecases/create.zone.use.case';
import { ListZonesUseCase } from '@zone/application/usecases/list.zones.use.case';
import { CreateZoneDto } from '@zone/application/dtos/create.zone.dto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt.auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zone')
export class ZoneController {
  constructor(
    private readonly createZoneUseCase: CreateZoneUseCase,
    private readonly listZonesUseCase: ListZonesUseCase,
    private readonly messageCatalogService: MessageCatalogService,
  ) { }

  @Post()
  async create(@Body() dto: CreateZoneDto) {
    await this.createZoneUseCase.execute(dto);
    const message = await this.messageCatalogService.getMessage(
      'ZONE_CREATED_SUCCESS',
      'es',
    );
    return {
      statusCode: 201,
      message,
    };
  }

  @Get()
  async findAll() {
    return await this.listZonesUseCase.execute();
  }
}