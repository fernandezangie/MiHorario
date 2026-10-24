import { CreateJobUseCase } from './create-job.use-case';
import { FindJobByIdUseCase } from './find-job-by-id.use-case';
import { ListJobsUseCase } from './list-jobs.use-case';
import { UpdateJobUseCase } from './update-job.use-case';
import { JobInMemoryRepository } from '@job/infrastructure/persistence/job-in-memory.repository';
import { JobEntity } from '@job/domain/model/entities/job.entity';

describe('Job Use Cases', () => {
  let repository: JobInMemoryRepository;
  let createJobUseCase: CreateJobUseCase;
  let findJobByIdUseCase: FindJobByIdUseCase;
  let listJobsUseCase: ListJobsUseCase;
  let updateJobUseCase: UpdateJobUseCase;

  beforeEach(() => {
    repository = new JobInMemoryRepository();
    createJobUseCase = new CreateJobUseCase(repository);
    findJobByIdUseCase = new FindJobByIdUseCase(repository);
    listJobsUseCase = new ListJobsUseCase(repository);
    updateJobUseCase = new UpdateJobUseCase(repository);
  });

  it('debería crear y guardar un puesto exitosamente', async () => {
    await createJobUseCase.execute({
      title: 'Desarrollador Backend',
      description: 'Responsable de APIs y NestJS',
    });

    const jobs = await listJobsUseCase.execute();
    expect(jobs.length).toBe(1);
    expect(jobs[0].getTitle()).toBe('Desarrollador Backend');
    expect(jobs[0].getDescription()).toBe('Responsable de APIs y NestJS');
  });

  it('debería encontrar un puesto por su ID', async () => {
    const job = new JobEntity('job-1', 'DevOps Engineer', 'Infraestructura cloud');
    await repository.save(job);

    const found = await findJobByIdUseCase.execute('job-1');
    expect(found).not.toBeNull();
    expect(found.getId()).toBe('job-1');
    expect(found.getTitle()).toBe('DevOps Engineer');
  });

  it('debería lanzar un error si el ID del puesto no existe al buscar', async () => {
    await expect(
      findJobByIdUseCase.execute('inexistente-id'),
    ).rejects.toThrow('El puesto no fue encontrado');
  });

  it('debería actualizar el título de un puesto existente', async () => {
    const job = new JobEntity('job-2', 'QA Manual', 'Pruebas funcionales');
    await repository.save(job);

    await updateJobUseCase.execute('job-2', { title: 'QA Automation' });

    const updated = await findJobByIdUseCase.execute('job-2');
    expect(updated.getTitle()).toBe('QA Automation');
  });
});