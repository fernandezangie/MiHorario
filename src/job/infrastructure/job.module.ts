import { Module } from '@nestjs/common';
import { JobController } from '@job/infrastructure/controllers/job.controller';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { IJobRepository } from '@job/domain/ports/job.repository.port';
import { JobInMemoryRepository } from '@job/infrastructure/persistence/job-in-memory.repository';

@Module({
  controllers: [JobController],
  providers: [
    CreateJobUseCase,
    {
      provide: IJobRepository,
      useClass: JobInMemoryRepository,
    },
  ],
  exports: [CreateJobUseCase],
})
export class JobModule {}