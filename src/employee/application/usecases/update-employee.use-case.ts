import { Injectable, Inject } from '@nestjs/common';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { UpdateEmployeeDto } from '@employee/application/dtos/update-employee.dto';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateEmployeeDto): Promise<void> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new Error('El empleado no existe para actualizar');
    }

    // Si viene un nuevo correo, usamos el método de dominio con su Value Object
    if (dto.email) {
      employee.updateEmail(new EmployeeEmail(dto.email));
    }

    // Persistimos la entidad actualizada usando save (o un método save en el repositorio)
    await this.employeeRepository.save(employee);
  }
}