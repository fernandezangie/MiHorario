import { CreateEmployeeUseCase } from './create-employee.use-case';
import { EmployeeInMemoryRepository } from '@employee/infrastructure/persistence/employee-in-memory.repository';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';
import { NotificationService } from '@shared/infrastructure/messaging/notification.service';

describe('CreateEmployeeUseCase', () => {
  it('debería crear y guardar un empleado exitosamente en memoria', async () => {
    // 1. Arrange (Preparar)
    const repository = new EmployeeInMemoryRepository();

    // Creamos un mock del servicio de notificaciones para cumplir con el constructor
    const mockNotificationService = {
      sendEmailNotification: jest.fn(),
    } as unknown as NotificationService;

    // Pasamos ambos argumentos requeridos
    const createEmployeeUseCase = new CreateEmployeeUseCase(
      repository,
      mockNotificationService,
    );

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
    expect(employees[0].getCode().getValue()).toBe('EMP001');
    expect(employees[0].getEmail().getValue()).toBe('prueba@mihorario.com');

    // Verificamos que también se haya disparado la notificación de bienvenida
    expect(mockNotificationService.sendEmailNotification).toHaveBeenCalledTimes(1);
  });
});