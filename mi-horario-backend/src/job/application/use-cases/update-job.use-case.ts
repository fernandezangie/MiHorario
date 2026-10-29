import { Inject, Injectable } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';

@Injectable()
export class UpdateJobUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
  ) {}

  async execute(id: string, dto: Partial<CreateJobDto>): Promise<void> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new Error('El puesto no existe para actualizar');
    }

    if (dto.title) {
      job.updateTitle(dto.title);
    }

    // Persistimos los cambios usando el repositorio (upsert)
    await this.jobRepository.save(job);
  }
}