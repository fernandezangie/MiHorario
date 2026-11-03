import { Inject, Injectable } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { CacheService } from '@shared/infrastructure/cache/cache.service';

@Injectable()
export class ListShiftsUseCase {
  private readonly CACHE_KEY = 'shifts:all_active';
  private readonly CACHE_TTL = 300;

  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
    private readonly cacheService: CacheService,
  ) {}

  async execute(): Promise<ShiftEntity[]> {
    const cachedShifts = await this.cacheService.get<ShiftEntity[]>(
      this.CACHE_KEY,
    );
    if (cachedShifts) {
      return cachedShifts;
    }

    const shifts = await this.shiftRepository.findAll();
    await this.cacheService.set(this.CACHE_KEY, shifts, this.CACHE_TTL);

    return shifts;
  }
}
