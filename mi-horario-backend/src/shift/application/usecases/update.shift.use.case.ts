import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateShiftDto } from '../dtos/update.shift.dto';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Injectable()
export class UpdateShiftUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  async execute(id: string, dto: UpdateShiftDto): Promise<void> {
    const shift = await this.shiftRepository.findById(id);
    if (!shift) {
      const msg = await this.messageCatalogService.getMessage(
        'SHIFT_NOT_FOUND',
        'es',
        { shiftId: id },
      );
      throw new NotFoundException(msg || 'Turno no encontrado.');
    }

    const startTime =
      dto.startTime !== undefined
        ? dto.startTime
          ? new Date(dto.startTime)
          : null
        : shift.getStartTime();
    const endTime =
      dto.endTime !== undefined
        ? dto.endTime
          ? new Date(dto.endTime)
          : null
        : shift.getEndTime();
    const isRest = dto.isRest !== undefined ? dto.isRest : shift.getIsRest();

    if (!isRest && startTime && endTime) {
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
      const mesActual = getBogotaPart('month') - 1;
      const diaActual = getBogotaPart('day');
      const horaActualNum = getBogotaPart('hour') % 24;
      const minutoActualNum = getBogotaPart('minute');

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
        parseInt(
          shiftBogotaParts.find((p) => p.type === type)?.value || '0',
          10,
        );

      const anioTurno = getShiftPart('year');
      const mesTurno = getShiftPart('month') - 1;
      const diaTurno = getShiftPart('day');
      const startHour = getShiftPart('hour') % 24;
      const startMinute = getShiftPart('minute');
      // ===============================================================

      if (
        anioTurno < anioActual ||
        (anioTurno === anioActual && mesTurno < mesActual)
      ) {
        const msg = await this.messageCatalogService.getMessage(
          'SHIFT_PAST_YEAR_MONTH',
          'es',
        );
        throw new BadRequestException(
          msg || 'No se pueden modificar turnos de meses o años pasados.',
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

      // Hora de salida en zona Bogotá (hora y minuto)
      const endParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Bogota',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(endTime);

      const endHour =
        parseInt(endParts.find((p) => p.type === 'hour')?.value || '0', 10) %
        24;
      const endMinute = parseInt(
        endParts.find((p) => p.type === 'minute')?.value || '0',
        10,
      );

      const isStartTimeValid =
        startHour > 6 || (startHour === 6 && startMinute >= 0);
      const isEndTimeValid =
        endHour < 21 || (endHour === 21 && endMinute === 0);

      if (!isStartTimeValid || !isEndTimeValid) {
        const msg = await this.messageCatalogService.getMessage(
          'SHIFT_OUT_OF_HOURS',
          'es',
        );
        throw new BadRequestException(
          msg || 'El turno está fuera del horario permitido.',
        );
      }
    }

    const newZone =
      dto.zone !== undefined
        ? dto.zone
        : dto.location !== undefined
          ? dto.location
          : ((shift as any).getZone?.() ?? null);

    const newJob =
      dto.jobId !== undefined
        ? dto.jobId
        : (dto as any).job !== undefined
          ? (dto as any).job
          : typeof shift.getJob === 'function'
            ? shift.getJob()
            : null;

    shift.updateDetails(startTime, endTime, isRest, newZone, newJob);
    await this.shiftRepository.save(shift);
  }
}
