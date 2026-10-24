import { Module } from '@nestjs/common';
import { JobController } from './controllers/job.controller';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { FindJobByIdUseCase } from '@job/application/use-cases/find-job-by-id.use-case';
import { ListJobsUseCase } from '@job/application/use-cases/list-jobs.use-case';
import { UpdateJobUseCase } from '@job/application/use-cases/update-job.use-case';
import { JobInMemoryRepository } from './persistence/job-in-memory.repository';

@Module({
  controllers: [JobController],
  providers: [
    CreateJobUseCase,
    FindJobByIdUseCase,
    ListJobsUseCase,
    UpdateJobUseCase,
    {
      provide: 'JobRepositoryPort',
      useClass: JobInMemoryRepository,
    },
  ],
})
export class JobModule {}