import { Inject, Injectable } from '@nestjs/common';
import { RestrictionRepositoryPort } from '@restriction/domain/ports/restriction.repository.port';
import { CreateRestrictionDto } from '@restriction/application/dtos/create-restriction.dto';
import { RestrictionEntity } from '@restriction/domain/model/entities/restriction.entity';

@Injectable()
export class CreateRestrictionUseCase {
  constructor(
    @Inject('RestrictionRepositoryPort')
    private readonly restrictionRepository: RestrictionRepositoryPort,
  ) {}

  async execute(dto: CreateRestrictionDto): Promise<void> {
    const restriction = new RestrictionEntity(
      Date.now().toString(),
      dto.employeeId,
      dto.type,
      dto.value,
      dto.description,
    );

    await this.restrictionRepository.save(restriction);
  }
}