import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestrictionRepositoryPort } from '@restriction/domain/ports/restriction.repository.port';
import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';
import { RestrictionOrmEntity } from './restriction.orm-entity';

@Injectable()
export class RestrictionTypeOrmRepository implements RestrictionRepositoryPort {
  constructor(
    @InjectRepository(RestrictionOrmEntity)
    private readonly ormRepository: Repository<RestrictionOrmEntity>,
  ) {}

  async save(restriction: RestrictionEntity): Promise<void> {
    const r = restriction as any;
    const ormEntity = new RestrictionOrmEntity();
    ormEntity.id = r.id?.value ?? r.id;
    ormEntity.type = r.type?.value ?? r.type;
    ormEntity.description = r.description?.value ?? r.description;
    ormEntity.employeeId = r.employeeId?.value ?? r.employeeId;

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<RestrictionEntity | null> {
    const rawId = typeof id === 'object' && id !== null && 'value' in id ? id.value : id;
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    const entity = Object.create(RestrictionEntity.prototype);
    return Object.assign(entity, {
      id: found.id,
      type: found.type,
      description: found.description,
      employeeId: found.employeeId,
    });
  }

  async findByEmployeeId(employeeId: any): Promise<RestrictionEntity[]> {
    const rawEmployeeId = typeof employeeId === 'object' && employeeId !== null && 'value' in employeeId ? employeeId.value : employeeId;
    const list = await this.ormRepository.find({ where: { employeeId: rawEmployeeId } });

    return list.map((item) => {
      const entity = Object.create(RestrictionEntity.prototype);
      return Object.assign(entity, {
        id: item.id,
        type: item.type,
        description: item.description,
        employeeId: item.employeeId,
      });
    });
  }

  async findAll(): Promise<RestrictionEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => {
      const entity = Object.create(RestrictionEntity.prototype);
      return Object.assign(entity, {
        id: item.id,
        type: item.type,
        description: item.description,
        employeeId: item.employeeId,
      });
    });
  }
}