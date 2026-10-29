import { Inject, Injectable } from '@nestjs/common';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { AssignShiftDto } from '@shift/application/dtos/assign-shift.dto';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';

@Injectable()
export class AssignShiftToEmployeeUseCase {
  constructor(
    @Inject('ShiftRepositoryPort')
    private readonly shiftRepository: ShiftRepositoryPort,
  ) {}

  async execute(dto: AssignShiftDto): Promise<void> {
    const shift = new ShiftEntity(
      Date.now().toString(),
      dto.employeeId,
      dto.jobId,
      new Date(dto.startTime),
      new Date(dto.endTime),
    );

    await this.shiftRepository.save(shift);
  }
}