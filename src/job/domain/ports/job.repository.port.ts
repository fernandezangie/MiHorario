import { JobEntity } from '@job/domain/model/entities/job.entity';

export interface IJobRepository {
  save(job: JobEntity): Promise<JobEntity>;
  findAll(): Promise<JobEntity[]>;
}

export const IJobRepository = Symbol('IJobRepository');