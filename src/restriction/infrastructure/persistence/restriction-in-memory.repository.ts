import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';
import { RestrictionRepositoryPort } from '@restriction/domain/ports/restriction.repository.port';

export class RestrictionInMemoryRepository implements RestrictionRepositoryPort {
  private restrictions: RestrictionEntity[] = [];

  async save(restriction: RestrictionEntity): Promise<void> {
    const index = this.restrictions.findIndex((r) => r.getId() === restriction.getId());
    if (index !== -1) {
      this.restrictions[index] = restriction;
    } else {
      this.restrictions.push(restriction);
    }
  }

  async findById(id: string): Promise<RestrictionEntity | null> {
    const restriction = this.restrictions.find((r) => r.getId() === id);
    return restriction || null;
  }

  async findByEmployeeId(employeeId: string): Promise<RestrictionEntity[]> {
    return this.restrictions.filter((r) => r.getEmployeeId() === employeeId);
  }

  async findAll(): Promise<RestrictionEntity[]> {
    return this.restrictions;
  }
}