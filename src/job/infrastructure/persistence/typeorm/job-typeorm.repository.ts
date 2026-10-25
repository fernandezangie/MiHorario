import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobRepositoryPort } from '@job/domain/ports/job.repository.port';
import { JobEntity } from '@job/domain/model/entities/job.entity';
import { JobOrmEntity } from './job.orm-entity';

@Injectable()
export class JobTypeOrmRepository implements JobRepositoryPort {
  constructor(
    @InjectRepository(JobOrmEntity)
    private readonly ormRepository: Repository<JobOrmEntity>,
  ) {}

  async save(job: JobEntity): Promise<void> {
    const j = job as any;
    const ormEntity = new JobOrmEntity();
    ormEntity.id = j.id?.value ?? j.id;
    ormEntity.title = j.title?.value ?? j.title;
    ormEntity.description = j.description?.value ?? j.description;

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<JobEntity | null> {
    const rawId = typeof id === 'object' && id !== null && 'value' in id ? id.value : id;
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    return new JobEntity(found.id as any, found.title as any, found.description as any);
  }

  async findAll(): Promise<JobEntity[]> {
    const list = await this.ormRepository.find();
    return list.map(
      (item) => new JobEntity(item.id as any, item.title as any, item.description as any),
    );
  }
}