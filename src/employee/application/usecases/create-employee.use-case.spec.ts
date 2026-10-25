import { CreateEmployeeUseCase } from './create-employee.use-case';
import { EmployeeInMemoryRepository } from '@employee/infrastructure/persistence/employee-in-memory.repository';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';

describe('CreateEmployeeUseCase', () => {
  it('debería crear y guardar un empleado exitosamente en memoria', async () => {
    // 1. Arrange (Preparar)
    const repository = new EmployeeInMemoryRepository();
    const createEmployeeUseCase = new CreateEmployeeUseCase(repository);

    const dto: CreateEmployeeDto = {
      code: 'EMP001',
      name: 'Pedro',
      email: 'prueba@mihorario.com',
    };

    // 2. Act (Ejecutar)
    await createEmployeeUseCase.execute(dto);

    // 3. Assert (Verificar)
    const employees = await repository.findAll();
    expect(employees.length).toBe(1);
    expect(employees[0].getCode().getValue()).toBe('EMP001'); // <-- Actualizado sin guion
    expect(employees[0].getEmail().getValue()).toBe('prueba@mihorario.com');
  });
});