import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';

@Injectable()
export class AcknowledgeShiftUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
  ) {}

  async execute(shiftId: string): Promise<void> {
    const shift = await this.shiftRepository.findById(shiftId);

    if (!shift) {
      throw new NotFoundException(`Turno con ID ${shiftId} no encontrado.`);
    }

    // Llamamos al método público de la entidad para cambiar el estado de forma segura
    shift.acknowledge();

    // Guardamos los cambios
    await this.shiftRepository.save(shift);
  }
}
