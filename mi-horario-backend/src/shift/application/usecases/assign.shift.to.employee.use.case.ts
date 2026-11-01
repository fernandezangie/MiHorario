import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { AssignShiftDto } from '@shift/application/dtos/assign.shift.dto';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { NotificationService } from '@shared/infrastructure/messaging/notification.service';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { CacheService } from '@shared/infrastructure/cache/cache.service';

@Injectable()
export class AssignShiftToEmployeeUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    @Inject('EmployeeRepositoryPort')
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly messageCatalogService: MessageCatalogService,
    private readonly cacheService: CacheService,
  ) {}

  async execute(dto: AssignShiftDto): Promise<void> {

    // 0. Validar que los campos obligatorios existan
    if (!dto?.employeeId || !dto?.startTime || !dto?.endTime) {
      throw new BadRequestException(
        'employeeId, startTime y endTime son obligatorios.',
      );
    }

    // 1. Validar y construir las fechas ANTES de tocar la base de datos
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException(
        'Las fechas de inicio y fin no son válidas. Usa formato ISO 8601, por ejemplo 2026-11-01T08:00:00Z.',
      );
    }

    if (endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    // 2. Buscar al empleado para obtener su correo electrónico
    const employee = await this.employeeRepository.findById(dto.employeeId);
    if (!employee) {
      const errorMsg = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_FOUND',
        'es',
        { id: dto.employeeId },
      );
      throw new NotFoundException(errorMsg || 'El empleado no existe.');
    }

    // 3. Crear la entidad de turno
    const shift = new ShiftEntity(
      Date.now().toString(),
      dto.employeeId,
      startTime,
      endTime,
    );

    // --- DIAGNÓSTICO TEMPORAL (borrar después) ---
    console.log('Shift entity:', JSON.stringify(shift));
    // ---------------------------------------------

    // 4. Guardar el turno (validación de solapamiento y reintentos en el repositorio)
    await this.shiftRepository.save(shift);

    // 5. Invalidar la caché de turnos
    await this.cacheService.del('shifts:all_active');

    // 6. Obtener el asunto del correo desde Redis
    const shiftSubject = await this.messageCatalogService.getMessage(
      'NEW_SHIFT_EMAIL_SUBJECT',
      'es',
    );

    // 7. Enviar la notificación por correo (no debe romper la operación si falla)
    try {
      await this.notificationService.sendEmailNotification(
        'NEW_SHIFT_EMAIL_SUBJECT',
        employee.getEmail().getValue(),
        shiftSubject,
        {
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      );
    } catch (error) {
      console.error(
        'No se pudo enviar el correo, pero el turno fue creado:',
        error,
      );
    }
  }
}
