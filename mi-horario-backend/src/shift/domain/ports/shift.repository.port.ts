import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';

export interface ShiftRepositoryPort {
  save(shift: ShiftEntity): Promise<void>;
  findById(id: string): Promise<ShiftEntity | null>;
  findAll(): Promise<ShiftEntity[]>;
}