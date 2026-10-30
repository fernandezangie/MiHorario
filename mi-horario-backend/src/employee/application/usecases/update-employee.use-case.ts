import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { UpdateEmployeeDto } from '@employee/application/dtos/update-employee.dto';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
  ) {}

  async execute(id: string, dto: UpdateEmployeeDto): Promise<void> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      // Obtenemos el mensaje dinámico desde Redis
      const errorMessage = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_FOUND_FOR_UPDATE',
        'es',
        { id },
      );
      throw new NotFoundException(errorMessage);
    }

    // Si viene un nuevo correo, usamos el método de dominio con su Value Object
    if (dto.email) {
      employee.updateEmail(new EmployeeEmail(dto.email));
    }

    // Persistimos la entidad actualizada usando save
    await this.employeeRepository.save(employee);
  }
}
