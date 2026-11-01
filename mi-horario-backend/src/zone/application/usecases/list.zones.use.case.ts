import { Inject, Injectable } from '@nestjs/common';
import { ZoneRepositoryPort } from '@zone/domain/ports/zone.repository.port';
import { ZoneEntity } from '@zone/domain/model/entities/zone.entity';

@Injectable()
export class ListZonesUseCase {
  constructor(
    @Inject('ZoneRepositoryPort')
    private readonly zoneRepository: ZoneRepositoryPort,
  ) {}

  async execute(): Promise<ZoneEntity[]> {
    return await this.zoneRepository.findAll();
  }
}