import { Inject, Injectable } from '@nestjs/common';
import { RestrictionRepositoryPort } from '@restriction/domain/ports/restriction.repository.port';
import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';

@Injectable()
export class ListRestrictionsUseCase {
  constructor(
    @Inject('RestrictionRepositoryPort')
    private readonly restrictionRepository: RestrictionRepositoryPort,
  ) {}

  async execute(): Promise<RestrictionEntity[]> {
    return await this.restrictionRepository.findAll();
  }
}