import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftController } from './controllers/shift.controller';
import { ShiftOrmEntity } from './persistence/typeorm/shift.orm-entity';
import { ShiftTypeOrmRepository } from './persistence/typeorm/shift-typeorm.repository';
import { CreateShiftUseCase } from '@shift/application/use-cases/create-shift.use-case';
import { ListShiftsUseCase } from '@shift/application/use-cases/list-shifts.use-case';
import { FindShiftByIdUseCase } from '@shift/application/use-cases/find-shift-by-id.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftOrmEntity])],
  controllers: [ShiftController],
  providers: [
    CreateShiftUseCase,
    ListShiftsUseCase,
    FindShiftByIdUseCase, // <-- ¡Registrado aquí!
    {
      provide: 'ShiftRepositoryPort',
      useClass: ShiftTypeOrmRepository,
    },
  ],
  exports: [CreateShiftUseCase, ListShiftsUseCase, FindShiftByIdUseCase],
})
export class ShiftModule {}