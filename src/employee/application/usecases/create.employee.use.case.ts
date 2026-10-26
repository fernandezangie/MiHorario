import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';
import { Inject } from '@nestjs/common';
import { NotificationService } from '@shared/infrastructure/messaging/notification.service';
import { EmployeeName } from '@employee/domain/model/value-objects/employee-name.vo';

export class CreateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<void> {
    const employee = new EmployeeEntity(
      Date.now().toString(),
      new EmployeeCode(dto.code),
      new EmployeeName(dto.name), // <-- Envolvemos el string en el Value Object
      new EmployeeEmail(dto.email),
      EmployeeStatus.ACTIVE,
    );

    // 1. Guardar el empleado en la base de datos
    await this.employeeRepository.save(employee);

    // 2. Enviar el correo de bienvenida
    await this.notificationService.sendEmailNotification(
      'WELCOME_EMPLOYEE',
      employee.getEmail().getValue(),
      '¡Bienvenido a MiHorario!',
      {
        code: employee.getCode().getValue(),
        name: employee.getName().getValue(), // <-- Obtenemos el valor del nombre
        status: employee.getStatus(),
      },
    );
  }
}