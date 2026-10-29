import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobController } from './controllers/job.controller';
import { JobOrmEntity } from './persistence/typeorm/job.orm-entity';
import { JobTypeOrmRepository } from './persistence/typeorm/job-typeorm.repository';
import { CreateJobUseCase } from '@job/application/use-cases/create-job.use-case';
import { ListJobsUseCase } from '@job/application/use-cases/list-jobs.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([JobOrmEntity])],
  controllers: [JobController],
  providers: [
    CreateJobUseCase,
    ListJobsUseCase,
    {
      provide: 'JobRepositoryPort',
      useClass: JobTypeOrmRepository,
    },
  ],
  exports: [CreateJobUseCase, ListJobsUseCase],
})
export class JobModule {}