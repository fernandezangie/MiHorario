import { Inject, Injectable } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';
import { JobEntity } from '@job/domain/model/entities/job.entity';

@Injectable()
export class CreateJobUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
  ) {}

  async execute(dto: CreateJobDto): Promise<void> {
    const job = new JobEntity(
      Date.now().toString(),
      dto.title,
      dto.description,
    );

    await this.jobRepository.save(job);
  }
}