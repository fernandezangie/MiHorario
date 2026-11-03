import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftController } from './controllers/shift.controller';
import { ShiftOrmEntity } from './persistence/typeorm/shift.orm.entity';
import { ShiftTypeormRepository } from './persistence/typeorm/shift.typeorm.repository';
import { AssignShiftToEmployeeUseCase } from '@shift/application/usecases/assign.shift.to.employee.use.case';
import { ListShiftsUseCase } from '@shift/application/usecases/list.shifts.use.case';
import { FindShiftByIdUseCase } from '@shift/application/usecases/find.shift.by.id.use.case';
import { AcknowledgeShiftUseCase } from '@shift/application/usecases/acknowledge.shift.use.case';
import { UpdateShiftUseCase } from '@shift/application/usecases/update.shift.use.case';
import { EmployeeModule } from '@employee/infrastructure/employee.module';
import { MessagingModule } from '@shared/infrastructure/messaging/messaging.module';
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftOrmEntity]),
    EmployeeModule,
    MessagingModule,
    CustomCacheModule,
  ],
  controllers: [ShiftController],
  providers: [
    AssignShiftToEmployeeUseCase,
    ListShiftsUseCase,
    FindShiftByIdUseCase,
    AcknowledgeShiftUseCase,
    UpdateShiftUseCase,
    {
      provide: 'ShiftRepositoryPort',
      useClass: ShiftTypeormRepository,
    },
  ],
  exports: [
    AssignShiftToEmployeeUseCase,
    ListShiftsUseCase,
    FindShiftByIdUseCase,
    AcknowledgeShiftUseCase,
    UpdateShiftUseCase,
  ],
})
export class ShiftModule {}
