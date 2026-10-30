import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

@Injectable()
export class UpdateJobUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
  ) {}

  async execute(id: string, dto: Partial<CreateJobDto>): Promise<void> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      // Obtenemos el mensaje dinámico desde Redis inyectando el parámetro {id}
      const errorMessage = await this.messageCatalogService.getMessage(
        'JOB_NOT_FOUND_FOR_UPDATE',
        'es',
        { id },
      );
      throw new NotFoundException(errorMessage);
    }

    if (dto.title) {
      job.updateTitle(dto.title);
    }

    // Persistimos los cambios usando el repositorio (upsert)
    await this.jobRepository.save(job);
  }
}
