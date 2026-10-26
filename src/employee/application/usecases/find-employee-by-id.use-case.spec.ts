import { FindEmployeeByIdUseCase } from './find-employee-by-id.use-case';
import { EmployeeInMemoryRepository } from '@employee/infrastructure/persistence/employee-in-memory.repository';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';
import { EmployeeName } from '@employee/domain/model/value-objects/employee-name.vo';

describe('FindEmployeeByIdUseCase', () => {
  it('debería encontrar y retornar un empleado cuando existe el ID', async () => {
    // 1. Arrange (Preparar)
    const repository = new EmployeeInMemoryRepository();
    const findEmployeeByIdUseCase = new FindEmployeeByIdUseCase(repository);

    const employee = new EmployeeEntity(
      'uuid-123',
      new EmployeeCode('EMP001'),
      new EmployeeName('Nombre Test'),           // <-- 3er argumento: EmployeeName
      new EmployeeEmail('empleado@mihorario.com'), // <-- 4to argumento: EmployeeEmail
      EmployeeStatus.ACTIVE,
    );
    await repository.save(employee);

    // 2. Act (Ejecutar)
    const result = await findEmployeeByIdUseCase.execute('uuid-123');

    // 3. Assert (Verificar)
    expect(result).not.toBeNull();
    expect(result?.getId()).toBe('uuid-123');
    expect(result?.getCode().getValue()).toBe('EMP001');
    expect(result?.getEmail().getValue()).toBe('empleado@mihorario.com');
  });

  it('debería lanzar un error si el ID del empleado no existe', async () => {
    // 1. Arrange
    const repository = new EmployeeInMemoryRepository();
    const findEmployeeByIdUseCase = new FindEmployeeByIdUseCase(repository);

    // 2. Act & Assert (Verificamos que arroje la excepción esperada)
    await expect(
      findEmployeeByIdUseCase.execute('id-inexistente'),
    ).rejects.toThrow('El empleado no fue encontrado');
  });
});