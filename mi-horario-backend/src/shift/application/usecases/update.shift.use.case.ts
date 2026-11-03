import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UpdateShiftDto } from '../dtos/update.shift.dto';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';

@Injectable()
export class UpdateShiftUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
  ) {}

  async execute(id: string, dto: UpdateShiftDto): Promise<void> {
    const shift = await this.shiftRepository.findById(id);
    if (!shift) {
      throw new NotFoundException(`Turno con ID ${id} no encontrado.`);
    }

    // Determinamos los nuevos valores basándonos en lo que trae el DTO o manteniendo lo que ya tenía
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

    // Actualizamos usando el método de dominio
    shift.updateDetails(startTime, endTime, isRest);

    // Guardamos con el repositorio
    await this.shiftRepository.save(shift);
  }
}
