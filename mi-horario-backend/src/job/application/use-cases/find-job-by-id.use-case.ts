import { Inject, Injectable } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';

@Injectable()
export class FindJobByIdUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
  ) {}

  async execute(id: string): Promise<JobEntity> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new Error('El puesto no fue encontrado');
    }
    return job;
  }
}