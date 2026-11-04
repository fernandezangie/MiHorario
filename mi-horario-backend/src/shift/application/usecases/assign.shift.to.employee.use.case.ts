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
    if (!dto?.employeeId || !dto?.startTime || !dto?.endTime) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_REQUIRED_FIELDS',
        'es',
      );
      throw new BadRequestException(msg);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_INVALID_DATE_FORMAT',
        'es',
      );
      throw new BadRequestException(msg);
    }

    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const mesActual = ahora.getMonth();
    const diaActual = ahora.getDate();

    const anioTurno = startTime.getFullYear();
    const mesTurno = startTime.getMonth();
    const diaTurno = startTime.getDate();

    if (
      anioTurno < anioActual ||
      (anioTurno === anioActual && mesTurno < mesActual)
    ) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_PAST_YEAR_MONTH',
        'es',
      );
      throw new BadRequestException(msg);
    }

    if (
      anioTurno === anioActual &&
      mesTurno === mesActual &&
      diaTurno < diaActual
    ) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_PAST_DAY',
        'es',
        { diaTurno: diaTurno.toString(), diaActual: diaActual.toString() },
      );
      throw new BadRequestException(msg);
    }

    if (endTime <= startTime) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_INVALID_END_TIME',
        'es',
      );
      throw new BadRequestException(msg);
    }

    const startHour = parseInt(
      startTime
        .toLocaleTimeString('en-GB', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
        .split(':')[0],
      10,
    );
    const startMinute = startTime.getMinutes();

    const endHour = parseInt(
      endTime
        .toLocaleTimeString('en-GB', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })
        .split(':')[0],
      10,
    );
    const endMinute = endTime.getMinutes();

    const isStartTimeValid =
      startHour > 6 || (startHour === 6 && startMinute >= 0);
    const isEndTimeValid = endHour < 21 || (endHour === 21 && endMinute === 0);

    if (!isStartTimeValid || !isEndTimeValid) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_OUT_OF_HOURS',
        'es',
      );
      throw new BadRequestException(msg);
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
      throw new NotFoundException(errorMsg);
    }

    const foundUser = userRecords[0];
    const targetEmployeeId = foundUser.employeeId || foundUser.id;
    const employeeEmail = foundUser.email;

    const shiftId = (dto as any).id || Date.now().toString();
    const zoneToSave = dto.zone || dto.location || null;
    const jobToSave = dto.jobId || (dto as any).job || null;

    const shift = new ShiftEntity(
      shiftId,
      targetEmployeeId,
      startTime,
      endTime,
      false, // acknowledged
      false, // isRest
      zoneToSave, // zone
      jobToSave, // jobId
    );

    await this.shiftRepository.save(shift);

    await this.cacheService.del('shifts:all_active');
    const shiftSubject = await this.messageCatalogService.getMessage(
      'NEW_SHIFT_EMAIL_SUBJECT',
      'es',
    );

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
