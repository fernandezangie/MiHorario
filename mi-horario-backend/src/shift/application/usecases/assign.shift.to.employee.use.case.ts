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
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AssignShiftToEmployeeUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    private readonly notificationService: NotificationService,
    private readonly messageCatalogService: MessageCatalogService,
    private readonly cacheService: CacheService,
    private readonly dataSource: DataSource,
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
        'Las fechas de inicio y fin no son válidas. Usa formato ISO 8601.',
      );
    }

    // Validar que no se asignen turnos en meses o días pasados
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth(); // Noviembre = 10
    const diaActual = ahora.getDate();

    const anioTurno = startTime.getFullYear();
    const mesTurno = startTime.getMonth();
    const diaTurno = startTime.getDate();

    if (
      anioTurno < anioActual ||
      (anioTurno === anioActual && mesTurno < mesActual)
    ) {
      throw new BadRequestException(
        'No se pueden asignar ni modificar turnos de meses o años pasados.',
      );
    }

    if (
      anioTurno === anioActual &&
      mesTurno === mesActual &&
      diaTurno < diaActual
    ) {
      throw new BadRequestException(
        `No se pueden asignar ni modificar turnos de días pasados (Día ${diaTurno}). El día actual es ${diaActual}.`,
      );
    }

    if (endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio.',
      );
    }

    // 2. Buscar al colaborador directamente en la tabla real "public.users"
    const userRecords = await this.dataSource.query(
      `SELECT id, "employeeId", email, name, code FROM public.users WHERE id = $1 OR code = $1 OR email = $1 OR name = $1`,
      [dto.employeeId],
    );

    if (!userRecords || userRecords.length === 0) {
      const errorMsg = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_FOUND',
        'es',
        { id: dto.employeeId },
      );
      throw new NotFoundException(errorMsg || 'El empleado no existe.');
    }

    const foundUser = userRecords[0];
    const targetEmployeeId = foundUser.employeeId || foundUser.id;
    const employeeEmail = foundUser.email;

    // 3. Crear la entidad de turno asegurando usar el ID correcto
    const shiftId = dto.id || Date.now().toString();
    const shift = new ShiftEntity(
      shiftId,
      targetEmployeeId,
      startTime,
      endTime,
    );

    // 4. Guardar el turno (con validación de solapamiento y transacciones)
    await this.shiftRepository.save(shift);

    // 5. Invalidar la caché de turnos
    await this.cacheService.del('shifts:all_active');

    // 6. Obtener el asunto del correo desde el catálogo de mensajes
    const shiftSubject = await this.messageCatalogService.getMessage(
      'NEW_SHIFT_EMAIL_SUBJECT',
      'es',
    );

    // 7. Enviar la notificación por correo electrónico de manera segura
    try {
      if (employeeEmail) {
        await this.notificationService.sendEmailNotification(
          'NEW_SHIFT_EMAIL_SUBJECT',
          employeeEmail,
          shiftSubject,
          {
            startTime: dto.startTime,
            endTime: dto.endTime,
          },
        );
      }
    } catch (error) {
      console.error(
        'No se pudo enviar el correo, pero el turno fue creado exitosamente:',
        error,
      );
    }
  }
}
