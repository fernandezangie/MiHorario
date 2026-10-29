import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { ShiftOrmEntity } from './shift.orm-entity';

@Injectable()
export class ShiftTypeOrmRepository implements ShiftRepositoryPort {
  constructor(
    @InjectRepository(ShiftOrmEntity)
    private readonly ormRepository: Repository<ShiftOrmEntity>,
  ) {}

  async save(shift: ShiftEntity): Promise<void> {
    const s = shift as any;
    const ormEntity = new ShiftOrmEntity();
    ormEntity.id = s.id?.value ?? s.id;
    ormEntity.employeeId = s.employeeId?.value ?? s.employeeId;
    ormEntity.startTime = s.startTime?.value ?? s.startTime;
    ormEntity.endTime = s.endTime?.value ?? s.endTime;

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<ShiftEntity | null> {
    const rawId = typeof id === 'object' && id !== null && 'value' in id ? id.value : id;
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    const entity = Object.create(ShiftEntity.prototype);
    return Object.assign(entity, {
      id: found.id,
      employeeId: found.employeeId,
      startTime: found.startTime,
      endTime: found.endTime,
    });
  }

  async findAll(): Promise<ShiftEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => {
      const entity = Object.create(ShiftEntity.prototype);
      return Object.assign(entity, {
        id: item.id,
        employeeId: item.employeeId,
        startTime: item.startTime,
        endTime: item.endTime,
      });
    });
  }
}