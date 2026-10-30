import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { Inject, NotFoundException } from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message-catalog.service'; // <-- Importa el servicio

export class FindEmployeeByIdUseCase {
    constructor(
      @Inject('EmployeeRepositoryPort')
      private readonly employeeRepository: EmployeeRepositoryPort,
      private readonly messageCatalogService: MessageCatalogService, // <-- Inyecta el catálogo
    ) {}

  async execute(id: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      // Obtenemos el mensaje dinámico desde Redis inyectando el parámetro {id}
      const errorMessage = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_FOUND',
        'es',
        { id }
      );
      throw new NotFoundException(errorMessage);
    }
    return employee;
  }
}