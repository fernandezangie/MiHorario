import { Body, Controller, Post } from '@nestjs/common';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { CreateJobDto } from '@job/application/dtos/create-job.dto';

@Controller('jobs')
export class JobController {
  constructor(private readonly createJobUseCase: CreateJobUseCase) {}

  @Post()
  async create(@Body() dto: CreateJobDto) {
    return await this.createJobUseCase.execute(dto);
  }
}