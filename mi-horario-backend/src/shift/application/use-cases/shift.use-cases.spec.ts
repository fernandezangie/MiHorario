import { CreateShiftUseCase } from './create-shift.use-case';
import { AssignShiftToEmployeeUseCase } from './assign-shift-to-employee.use-case';
import { FindShiftByIdUseCase } from './find-shift-by-id.use-case';
import { ListShiftsUseCase } from './list-shifts.use-case';
import { ShiftInMemoryRepository } from '@shift/infrastructure/persistence/shift-in-memory.repository';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';

describe('Shift Use Cases', () => {
  let repository: ShiftInMemoryRepository;
  let createShiftUseCase: CreateShiftUseCase;
  let assignShiftUseCase: AssignShiftToEmployeeUseCase;
  let findShiftByIdUseCase: FindShiftByIdUseCase;
  let listShiftsUseCase: ListShiftsUseCase;

  beforeEach(() => {
    repository = new ShiftInMemoryRepository();
    createShiftUseCase = new CreateShiftUseCase(repository);
    assignShiftUseCase = new AssignShiftToEmployeeUseCase(repository);
    findShiftByIdUseCase = new FindShiftByIdUseCase(repository);
    listShiftsUseCase = new ListShiftsUseCase(repository);
  });

  it('debería crear y guardar un turno exitosamente', async () => {
    await createShiftUseCase.execute({
      employeeId: 'emp-1',
      jobId: 'job-1',
      startTime: '2026-10-25T08:00:00.000Z',
      endTime: '2026-10-25T16:00:00.000Z',
    });

    const shifts = await listShiftsUseCase.execute();
    expect(shifts.length).toBe(1);
    expect(shifts[0].getEmployeeId()).toBe('emp-1');
    expect(shifts[0].getJobId()).toBe('job-1');
  });

  it('debería asignar un turno a un empleado correctamente', async () => {
    await assignShiftUseCase.execute({
      employeeId: 'emp-2',
      jobId: 'job-2',
      startTime: '2026-10-26T09:00:00.000Z',
      endTime: '2026-10-26T17:00:00.000Z',
    });

    const shifts = await listShiftsUseCase.execute();
    expect(shifts.length).toBe(1);
    expect(shifts[0].getEmployeeId()).toBe('emp-2');
  });

  it('debería encontrar un turno por su ID', async () => {
    const shift = new ShiftEntity(
      'shift-123',
      'emp-1',
      'job-1',
      new Date('2026-10-25T08:00:00.000Z'),
      new Date('2026-10-25T16:00:00.000Z'),
    );
    await repository.save(shift);

    const found = await findShiftByIdUseCase.execute('shift-123');
    expect(found).not.toBeNull();
    expect(found.getId()).toBe('shift-123');
    expect(found.getEmployeeId()).toBe('emp-1');
  });

  it('debería lanzar un error si el turno no existe al buscar por ID', async () => {
    await expect(
      findShiftByIdUseCase.execute('shift-inexistente'),
    ).rejects.toThrow('El turno no fue encontrado');
  });
});