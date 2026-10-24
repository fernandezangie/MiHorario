import { JobEntity } from '@job/domain/model/entities/job.entity';

export interface JobRepositoryPort {
  save(job: JobEntity): Promise<void>;
  findById(id: string): Promise<JobEntity | null>;
  findAll(): Promise<JobEntity[]>;
}