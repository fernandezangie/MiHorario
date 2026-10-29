import { Controller, Post, Get, Body } from '@nestjs/common';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { Inject } from '@nestjs/common';

@Controller('job')
export class JobController {
  constructor(
    private readonly createJobUseCase: CreateJobUseCase,
    @Inject('JobRepositoryPort')
    private readonly jobRepository: JobRepositoryPort,
  ) {}

  @Post()
  async create(@Body() dto: CreateJobDto) {
    await this.createJobUseCase.execute(dto);
    return {
      statusCode: 201,
      message: 'Puesto creado exitosamente',
    };
  }

  @Get()
  async findAll() {
    return await this.jobRepository.findAll();
  }
}