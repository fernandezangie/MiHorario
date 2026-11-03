import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Injectable()
export class AcknowledgeShiftUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  async execute(shiftId: string): Promise<void> {
    const shift = await this.shiftRepository.findById(shiftId);

    if (!shift) {
      const message = await this.messageCatalogService.getMessage(
        'SHIFT_NOT_FOUND',
        'es',
        { shiftId },
      );

      throw new NotFoundException(message);
    }

    shift.acknowledge();
    await this.shiftRepository.save(shift);
  }
}
