import { ZoneEntity } from '@zone/domain/model/entities/zone.entity';
import { ZoneRepositoryPort } from '@zone/domain/ports/zone.repository.port';

export class ZoneInMemoryRepository implements ZoneRepositoryPort {
  private zones: ZoneEntity[] = [];

  async save(zone: ZoneEntity): Promise<void> {
    const index = this.zones.findIndex((z) => z.getId() === zone.getId());
    if (index !== -1) {
      this.zones[index] = zone;
    } else {
      this.zones.push(zone);
    }
  }

  async findById(id: string): Promise<ZoneEntity | null> {
    const zone = this.zones.find((z) => z.getId() === id);
    return zone || null;
  }

  async findAll(): Promise<ZoneEntity[]> {
    return this.zones;
  }
}