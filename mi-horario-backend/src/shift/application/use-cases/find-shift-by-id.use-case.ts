import { Inject, Injectable } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';

@Injectable()
export class FindShiftByIdUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
  ) {}

  async execute(id: string): Promise<ShiftEntity | null> {
    return await this.shiftRepository.findById(id);
  }
}