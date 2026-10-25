import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneRepositoryPort } from '@zone/domain/ports/zone.repository.port';
import { ZoneEntity } from '@zone/domain/model/entities/zone.entity';
import { ZoneOrmEntity } from './zone.orm-entity';

@Injectable()
export class ZoneTypeOrmRepository implements ZoneRepositoryPort {
  constructor(
    @InjectRepository(ZoneOrmEntity)
    private readonly ormRepository: Repository<ZoneOrmEntity>,
  ) {}

  async save(zone: ZoneEntity): Promise<void> {
    const z = zone as any;
    const ormEntity = new ZoneOrmEntity();
    ormEntity.id = z.id?.value ?? z.id;
    ormEntity.name = z.name?.value ?? z.name;
    ormEntity.description = z.description?.value ?? z.description;

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<ZoneEntity | null> {
    const rawId = typeof id === 'object' && id !== null && 'value' in id ? id.value : id;
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    const entity = Object.create(ZoneEntity.prototype);
    return Object.assign(entity, {
      id: found.id,
      name: found.name,
      description: found.description,
    });
  }

  async findAll(): Promise<ZoneEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => {
      const entity = Object.create(ZoneEntity.prototype);
      return Object.assign(entity, {
        id: item.id,
        name: item.name,
        description: item.description,
      });
    });
  }
}