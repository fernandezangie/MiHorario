import { Module } from '@nestjs/common';
import { ShiftController } from './controllers/shift.controller';
import { CreateShiftUseCase } from '@shift/application/use-cases/create-shift.use-case';
import { AssignShiftToEmployeeUseCase } from '@shift/application/use-cases/assign-shift-to-employee.use-case';
import { FindShiftByIdUseCase } from '@shift/application/use-cases/find-shift-by-id.use-case';
import { ListShiftsUseCase } from '@shift/application/use-cases/list-shifts.use-case';
import { ShiftInMemoryRepository } from './persistence/shift-in-memory.repository';

@Module({
  controllers: [ShiftController],
  providers: [
    CreateShiftUseCase,
    AssignShiftToEmployeeUseCase,
    FindShiftByIdUseCase,
    ListShiftsUseCase,
    {
      provide: 'ShiftRepositoryPort',
      useClass: ShiftInMemoryRepository,
    },
  ],
  exports: [
    CreateShiftUseCase,
    AssignShiftToEmployeeUseCase,
    FindShiftByIdUseCase,
    ListShiftsUseCase,
  ],
})
export class ShiftModule {}