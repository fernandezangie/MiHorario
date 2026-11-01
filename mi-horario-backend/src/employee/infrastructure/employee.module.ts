import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './controllers/employee.controller';
import { EmployeeOrmEntity } from './persistence/typeorm/employee.orm.entity';
import { EmployeeTypeormRepository } from './persistence/typeorm/employee.typeorm.repository';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list.employees.use.case';
import { SharedModule } from '@shared/infrastructure/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeOrmEntity]), SharedModule],
  controllers: [EmployeeController],
  providers: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    {
      provide: 'EmployeeRepositoryPort',
      useClass: EmployeeTypeormRepository,
    },
  ],
  exports: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    'EmployeeRepositoryPort', // 👈 ¡Agregado aquí para que ShiftModule pueda usarlo!
  ],
})
export class EmployeeModule {}
