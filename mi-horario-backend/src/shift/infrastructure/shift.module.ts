import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftController } from './controllers/shift.controller';
import { ShiftOrmEntity } from './persistence/typeorm/shift.orm.entity';
import { ShiftTypeormRepository } from './persistence/typeorm/shift.typeorm.repository';
import { AssignShiftToEmployeeUseCase } from '@shift/application/usecases/assign.shift.to.employee.use.case'; // <-- Nuevo caso de uso
import { ListShiftsUseCase } from '@shift/application/usecases/list.shifts.use.case';
import { FindShiftByIdUseCase } from '@shift/application/usecases/find.shift.by.id.use.case';
import { EmployeeModule } from '@employee/infrastructure/employee.module'; // Para buscar al empleado y obtener su correo
import { MessagingModule } from '@shared/infrastructure/messaging/messaging.module'; // Para NotificationService y MessageCatalogService
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module'; // Para la invalidación de caché en Redis

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftOrmEntity]),
    EmployeeModule,
    MessagingModule,
    CustomCacheModule,
  ],
  controllers: [ShiftController],
  providers: [
    AssignShiftToEmployeeUseCase, // <-- Registrado en lugar de CreateShiftUseCase
    ListShiftsUseCase,
    FindShiftByIdUseCase,
    {
      provide: 'ShiftRepositoryPort',
      useClass: ShiftTypeormRepository,
    },
  ],
  exports: [
    AssignShiftToEmployeeUseCase,
    ListShiftsUseCase,
    FindShiftByIdUseCase,
  ],
})
export class ShiftModule {}
