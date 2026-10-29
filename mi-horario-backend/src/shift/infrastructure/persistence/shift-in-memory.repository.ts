import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';

export class ShiftInMemoryRepository implements ShiftRepositoryPort {
  private shifts: ShiftEntity[] = [];

  async save(shift: ShiftEntity): Promise<void> {
    const index = this.shifts.findIndex((s) => s.getId() === shift.getId());
    if (index !== -1) {
      this.shifts[index] = shift;
    } else {
      this.shifts.push(shift);
    }
  }

  async findById(id: string): Promise<ShiftEntity | null> {
    const shift = this.shifts.find((s) => s.getId() === id);
    return shift || null;
  }

  async findAll(): Promise<ShiftEntity[]> {
    return this.shifts;
  }
}