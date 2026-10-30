import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { Inject } from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

@Controller('job')
export class JobController {
  constructor(
    private readonly createJobUseCase: CreateJobUseCase,
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
  ) {}

  @Post()
  async create(@Body() dto: CreateJobDto) {
    await this.createJobUseCase.execute(dto);

    // Obtenemos el mensaje de éxito dinámicamente desde Redis
    const successMessage = await this.messageCatalogService.getMessage(
      'JOB_CREATED_SUCCESS',
      'es',
    );

    return {
      statusCode: 201,
      message: successMessage,
    };
  }

  @Get()
  async findAll() {
    return await this.jobRepository.findAll();
  }
}
