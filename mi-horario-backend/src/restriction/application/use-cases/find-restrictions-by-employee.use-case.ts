import { Inject, Injectable } from '@nestjs/common';
import { RestrictionRepositoryPort } from '@restriction/domain/ports/restriction.repository.port';
import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';

@Injectable()
export class FindRestrictionsByEmployeeUseCase {
  constructor(
    @Inject('RestrictionRepositoryPort')
    private readonly restrictionRepository: RestrictionRepositoryPort,
  ) {}

  async execute(employeeId: string): Promise<RestrictionEntity[]> {
    return await this.restrictionRepository.findByEmployeeId(employeeId);
  }
}