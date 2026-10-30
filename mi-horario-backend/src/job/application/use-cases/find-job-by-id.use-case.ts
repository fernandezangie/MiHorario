import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

@Injectable()
export class FindJobByIdUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
  ) {}

  async execute(id: string): Promise<JobEntity> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      // Obtenemos el mensaje dinámico desde Redis inyectando el parámetro {id}
      const errorMessage = await this.messageCatalogService.getMessage(
        'JOB_NOT_FOUND',
        'es',
        { id },
      );
      throw new NotFoundException(errorMessage);
    }
    return job;
  }
}
