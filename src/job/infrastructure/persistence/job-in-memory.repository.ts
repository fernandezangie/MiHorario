import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';

@Injectable()
export class JobInMemoryRepository implements IJobRepository {
  private jobs: JobEntity[] = [];

  async save(job: JobEntity): Promise<JobEntity> {
    this.jobs.push(job);
    return job;
  }

  async findAll(): Promise<JobEntity[]> {
    return this.jobs;
  }
}