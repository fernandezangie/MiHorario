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
      throw new NotFoundException(msg);
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
      const isEndTimeValid =
        endHour < 21 || (endHour === 21 && endMinute === 0);

      if (!isStartTimeValid || !isEndTimeValid) {
        const msg = await this.messageCatalogService.getMessage(
          'SHIFT_OUT_OF_HOURS',
          'es',
        );
        throw new BadRequestException(msg);
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
