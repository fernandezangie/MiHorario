import { ZoneEntity } from '@zone/domain/model/entities/zone.entity';

export interface ZoneRepositoryPort {
  save(zone: ZoneEntity): Promise<void>;
  findById(id: string): Promise<ZoneEntity | null>;
  findAll(): Promise<ZoneEntity[]>;
}