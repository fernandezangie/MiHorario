import { Inject, Injectable } from '@nestjs/common';
import { IJobRepository } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';

@Injectable()
export class CreateJobUseCase {
  constructor(
    @Inject(IJobRepository)
    private readonly jobRepository: IJobRepository,
  ) {}

  async execute(dto: CreateJobDto): Promise<JobEntity> {
    const job = new JobEntity(
      Date.now().toString(),
      dto.title,
      dto.description,
    );
    return await this.jobRepository.save(job);
  }
}