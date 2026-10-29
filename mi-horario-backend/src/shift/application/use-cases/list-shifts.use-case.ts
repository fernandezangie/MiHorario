import { Inject, Injectable } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';

@Injectable()
export class ListShiftsUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
  ) {}

  async execute(): Promise<ShiftEntity[]> {
    return await this.shiftRepository.findAll();
  }
}