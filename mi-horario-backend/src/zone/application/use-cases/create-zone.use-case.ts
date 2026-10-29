import { Inject, Injectable } from '@nestjs/common';
import { ZoneRepositoryPort } from '@zone/domain/ports/zone.repository.port';
import { CreateZoneDto } from '@zone/application/dtos/create-zone.dto';
import { ZoneEntity } from '@zone/domain/model/entities/zone.entity';

@Injectable()
export class CreateZoneUseCase {
  constructor(
    @Inject('ZoneRepositoryPort')
    private readonly zoneRepository: ZoneRepositoryPort,
  ) {}

  async execute(dto: CreateZoneDto): Promise<void> {
    const zone = new ZoneEntity(
      Date.now().toString(),
      dto.name,
      dto.description,
      dto.location,
    );

    await this.zoneRepository.save(zone);
  }
}