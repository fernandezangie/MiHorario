import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobController } from './controllers/job.controller';
import { JobOrmEntity } from './persistence/typeorm/job.orm.entity';
import { JobTypeormRepository } from './persistence/typeorm/job.typeorm.repository';
import { CreateJobUseCase } from '@job/application/usecases/create.job.use.case';
import { ListJobsUseCase } from '@job/application/usecases/list.jobs.use.case';

@Module({
  imports: [TypeOrmModule.forFeature([JobOrmEntity])],
  controllers: [JobController],
  providers: [
    CreateJobUseCase,
    ListJobsUseCase,
    {
      provide: 'JobRepositoryPort',
      useClass: JobTypeormRepository,
    },
  ],
  exports: [CreateJobUseCase, ListJobsUseCase],
})
export class JobModule {}