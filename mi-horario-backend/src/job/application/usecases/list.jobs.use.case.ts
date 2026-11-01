import { Inject, Injectable } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';

@Injectable()
export class ListJobsUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
  ) {}

  async execute(): Promise<JobEntity[]> {
    return await this.jobRepository.findAll();
  }
}