import { Inject, Injectable } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { CreateShiftDto } from '@shift/application/dtos/create.shift.dto';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { CacheService } from '@shared/infrastructure/cache/cache.service';

@Injectable()
export class CreateShiftUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute(dto: CreateShiftDto): Promise<void> {
    // 1. Crear la entidad de turno con los 4 parámetros correctos
    const shift = new ShiftEntity(
      Date.now().toString(),
      dto.employeeId,
      new Date(dto.startTime),
      new Date(dto.endTime),
    );

    // 2. Guardar el turno en la base de datos
    await this.shiftRepository.save(shift);

    // 3. Invalidar la caché
    await this.cacheService.del('shifts:all_active');
  }
}
