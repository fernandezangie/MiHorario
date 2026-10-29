import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';

export interface RestrictionRepositoryPort {
  save(restriction: RestrictionEntity): Promise<void>;
  findById(id: string): Promise<RestrictionEntity | null>;
  findByEmployeeId(employeeId: string): Promise<RestrictionEntity[]>;
  findAll(): Promise<RestrictionEntity[]>;
}