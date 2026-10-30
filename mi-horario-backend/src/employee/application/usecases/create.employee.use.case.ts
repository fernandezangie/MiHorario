import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { CreateEmployeeDto } from '@employee/application/dtos/create-employee.dto';
import { Inject, BadRequestException } from '@nestjs/common';
import { NotificationService } from '@shared/infrastructure/messaging/notification.service';
import { EmployeeName } from '@employee/domain/model/value-objects/employee-name.vo';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio de catálogo

export class CreateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyectamos el catálogo de mensajes
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<void> {
    // Opcional: Validar si ya existe el empleado usando el catálogo para errores de negocio
    const existingEmployee = await this.employeeRepository.findById(dto.code);
    if (existingEmployee) {
      const errorMessage = await this.messageCatalogService.getMessage(
        'EMPLOYEE_ALREADY_EXISTS',
        'es',
        { code: dto.code },
      );
      throw new BadRequestException(errorMessage);
    }

    const employee = new EmployeeEntity(
      Date.now().toString(),
      new EmployeeCode(dto.code),
      new EmployeeName(dto.name),
      new EmployeeEmail(dto.email),
      EmployeeStatus.ACTIVE,
    );

    // 1. Guardar el empleado en la base de datos
    await this.employeeRepository.save(employee);

    // 2. Obtener mensaje del catálogo para el correo o la respuesta si lo requieres
    const welcomeSubject = await this.messageCatalogService.getMessage(
      'WELCOME_EMAIL_SUBJECT',
      'es',
    );

    // 3. Enviar el correo de bienvenida usando el texto dinámico de Redis
    await this.notificationService.sendEmailNotification(
      'WELCOME_EMPLOYEE',
      employee.getEmail().getValue(),
      welcomeSubject, // <-- Asunto obtenido desde Redis
      {
        code: employee.getCode().getValue(),
        name: employee.getName().getValue(),
        status: employee.getStatus(),
      },
    );
  }
}
