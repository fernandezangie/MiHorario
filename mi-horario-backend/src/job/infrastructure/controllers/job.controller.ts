import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateJobUseCase } from '@job/application/usecases/create.job.use.case';
import { CreateJobDto } from '@job/application/dtos/create.job.dto';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { Inject } from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt.auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job')
export class JobController {
  constructor(
    private readonly createJobUseCase: CreateJobUseCase,
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService,
  ) { }

  @Post()
  async create(@Body() dto: CreateJobDto) {
    await this.createJobUseCase.execute(dto);

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
