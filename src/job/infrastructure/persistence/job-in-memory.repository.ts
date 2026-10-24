import { JobEntity } from '@job/domain/model/entities/job.entity';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';

export class JobInMemoryRepository implements JobRepositoryPort {
  private jobs: JobEntity[] = [];

  async save(job: JobEntity): Promise<void> {
    const index = this.jobs.findIndex((j) => j.getId() === job.getId());
    if (index !== -1) {
      this.jobs[index] = job; // Actualiza si ya existe
    } else {
      this.jobs.push(job); // Inserta si es nuevo
    }
  }

  async findById(id: string): Promise<JobEntity | null> {
    const job = this.jobs.find((j) => j.getId() === id);
    return job || null;
  }

  async findAll(): Promise<JobEntity[]> {
    return this.jobs;
  }
}