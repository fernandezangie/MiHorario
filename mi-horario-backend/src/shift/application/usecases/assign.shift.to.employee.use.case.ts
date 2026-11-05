import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { AssignShiftDto } from '@shift/application/dtos/assign.shift.dto';
import {
  ShiftEntity,
  MIN_SHIFT_HOURS,
  MAX_SHIFT_HOURS,
} from '@shift/domain/model/entities/shift.entity';
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
    if (!dto?.employeeId || !dto?.startTime || !dto?.endTime) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_REQUIRED_FIELDS',
        'es',
      );
      throw new BadRequestException(msg || 'Campos requeridos faltantes.');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_INVALID_DATE_FORMAT',
        'es',
      );
      throw new BadRequestException(msg || 'Formato de fecha inválido.');
    }

    // === OBTENCIÓN SEGURA DE FECHA/HORA EN COLOMBIA (INEXPUGNABLE ANTE UTC) ===
    const now = new Date();
    const bogotaParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const getBogotaPart = (type: string) =>
      parseInt(bogotaParts.find((p) => p.type === type)?.value || '0', 10);

    const anioActual = getBogotaPart('year');
    const mesActual = getBogotaPart('month') - 1; // 0-indexed
    const diaActual = getBogotaPart('day');
    const horaActualNum = getBogotaPart('hour') % 24;
    const minutoActualNum = getBogotaPart('minute');

    // Desglose del turno en zona horaria de Colombia
    const shiftBogotaParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(startTime);

    const getShiftPart = (type: string) =>
      parseInt(shiftBogotaParts.find((p) => p.type === type)?.value || '0', 10);

    const anioTurno = getShiftPart('year');
    const mesTurno = getShiftPart('month') - 1;
    const diaTurno = getShiftPart('day');
    const startHour = getShiftPart('hour') % 24;
    const startMinute = getShiftPart('minute');
    // =======================================================================

    if (
      anioTurno < anioActual ||
      (anioTurno === anioActual && mesTurno < mesActual)
    ) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_PAST_YEAR_MONTH',
        'es',
      );
      throw new BadRequestException(
        msg || 'No se pueden asignar turnos de meses o años pasados.',
      );
    }

    // === 1. VALIDACIÓN DÍAS PASADOS (Redis: SHIFT_PAST_DAY) ===
    if (
      anioTurno === anioActual &&
      mesTurno === mesActual &&
      diaTurno < diaActual
    ) {
      let msg = await this.messageCatalogService.getMessage(
        'SHIFT_PAST_DAY',
        'es',
        {
          diaTurno: diaTurno.toString(),
          diaActual: diaActual.toString(),
        },
      );
      if (!msg) {
        msg = `No se puede asignar un turno en el día ${diaTurno} porque es anterior al día actual (${diaActual}).`;
      }
      throw new BadRequestException(msg);
    }

    // === 2. VALIDACIÓN HORA PASADA EN DÍA ACTUAL (Redis: SHIFT_PAST_HOUR) ===
    if (
      anioTurno === anioActual &&
      mesTurno === mesActual &&
      diaTurno === diaActual
    ) {
      const totalMinutosActuales = horaActualNum * 60 + minutoActualNum;
      const totalMinutosTurno = startHour * 60 + startMinute;

      if (totalMinutosTurno < totalMinutosActuales) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const horaTurnoStr = `${pad(startHour)}:${pad(startMinute)}`;
        const horaActualStr = `${pad(horaActualNum)}:${pad(minutoActualNum)}`;

        let msg = await this.messageCatalogService.getMessage(
          'SHIFT_PAST_HOUR',
          'es',
          { horaTurno: horaTurnoStr, horaActual: horaActualStr },
        );
        if (!msg) {
          msg = `No se puede asignar un turno a las ${horaTurnoStr} porque la hora actual es ${horaActualStr}.`;
        }
        throw new BadRequestException(msg);
      }
    }

    if (endTime <= startTime) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_INVALID_END_TIME',
        'es',
      );
      throw new BadRequestException(
        msg || 'La hora de salida debe ser mayor a la de entrada.',
      );
    }

    // === 3. DURACIÓN DE LA JORNADA: mínimo 8 h, máximo 12 h ===
    // (Redis: SHIFT_MIN_DURATION y SHIFT_MAX_DURATION)
    // Las constantes vienen de la entidad, que aplica la misma regla
    // como red de seguridad.
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    if (durationHours < MIN_SHIFT_HOURS) {
      let msg = await this.messageCatalogService.getMessage(
        'SHIFT_MIN_DURATION',
        'es',
        {
          minimo: MIN_SHIFT_HOURS.toString(),
          actual: durationHours.toFixed(1),
        },
      );
      if (!msg) {
        msg = `El turno debe durar al menos ${MIN_SHIFT_HOURS} horas (jornada laboral). Duración indicada: ${durationHours.toFixed(1)} horas.`;
      }
      throw new BadRequestException(msg);
    }

    if (durationHours > MAX_SHIFT_HOURS) {
      let msg = await this.messageCatalogService.getMessage(
        'SHIFT_MAX_DURATION',
        'es',
        {
          maximo: MAX_SHIFT_HOURS.toString(),
          actual: durationHours.toFixed(1),
        },
      );
      if (!msg) {
        msg = `El turno no puede durar más de ${MAX_SHIFT_HOURS} horas. Duración indicada: ${durationHours.toFixed(1)} horas.`;
      }
      throw new BadRequestException(msg);
    }

    // Hora de salida en zona Bogotá (hora y minuto)
    const endParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(endTime);

    const endHour =
      parseInt(endParts.find((p) => p.type === 'hour')?.value || '0', 10) % 24;
    const endMinute = parseInt(
      endParts.find((p) => p.type === 'minute')?.value || '0',
      10,
    );

    const isStartTimeValid =
      startHour > 6 || (startHour === 6 && startMinute >= 0);
    const isEndTimeValid = endHour < 21 || (endHour === 21 && endMinute === 0);

    if (!isStartTimeValid || !isEndTimeValid) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_OUT_OF_HOURS',
        'es',
      );
      throw new BadRequestException(
        msg || 'El turno está fuera del horario permitido.',
      );
    }

    let userRecords = await this.dataSource.query(
      `SELECT id, "employeeId", email, name, code FROM public.users WHERE id = $1 OR code = $1 OR email = $1 OR name = $1`,
      [dto.employeeId],
    );

    if (!userRecords || userRecords.length === 0) {
      userRecords = await this.dataSource.query(
        `SELECT id, id AS "employeeId", email, name, id AS code FROM public.employees WHERE id = $1 OR email = $1 OR name = $1`,
        [dto.employeeId],
      );
    }

    if (!userRecords || userRecords.length === 0) {
      const errorMsg = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_FOUND',
        'es',
        { id: dto.employeeId },
      );
      throw new NotFoundException(errorMsg || 'Colaborador no encontrado.');
    }

    const foundUser = userRecords[0];
    const targetEmployeeId = foundUser.employeeId || foundUser.id;
    const employeeEmail = foundUser.email;

    const shiftId = (dto as any).id || Date.now().toString();
    const zoneToSave = dto.zone || dto.location || null;
    const jobToSave = dto.jobId || (dto as any).job || null;

    // create() aplica también la regla de duración en el dominio
    const shift = ShiftEntity.create(
      shiftId,
      targetEmployeeId,
      startTime,
      endTime,
      false,
      false,
      zoneToSave,
      jobToSave,
    );

    await this.shiftRepository.save(shift);
    await this.cacheService.del('shifts:all_active');

    // El turno ya está guardado: el correo se envía en segundo plano
    // para que la respuesta no espere a Brevo ni a Redis.
    if (employeeEmail) {
      void this.sendShiftEmail(employeeEmail, startTime, endTime);
    }
  }

  private async sendShiftEmail(
    email: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    try {
      const subject = await this.messageCatalogService.getMessage(
        'NEW_SHIFT_EMAIL_SUBJECT',
        'es',
      );

      const format = (d: Date) =>
        d.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          dateStyle: 'full',
          timeStyle: 'short',
        });

      await this.notificationService.sendEmailNotification(
        'NEW_SHIFT_EMAIL_SUBJECT',
        email,
        subject || 'Nuevo turno asignado',
        { startTime: format(startTime), endTime: format(endTime) },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `No se pudo enviar el correo, pero el turno fue creado: ${message}`,
      );
    }
  }
}
