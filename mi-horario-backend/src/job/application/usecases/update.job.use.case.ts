import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { CreateJobDto } from '@job/application/dtos/create.job.dto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Injectable()
export class UpdateJobUseCase {
  constructor(
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  async execute(id: string, dto: Partial<CreateJobDto>): Promise<void> {
    const job = await this.jobRepository.findById(id);
    if (!job) {

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

    await this.jobRepository.save(job);
  }
}
