import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './controllers/employee.controller';
import { EmployeeOrmEntity } from './persistence/typeorm/employee.orm-entity';
import { EmployeeTypeOrmRepository } from './persistence/typeorm/employee-typeorm.repository';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { ListEmployeesUseCase } from '@employee/application/usecases/list-employees.use-case';
import { SharedModule } from '@shared/infrastructure/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeOrmEntity]),
    SharedModule, // <-- Habilita el NotificationService aquí
  ],
  controllers: [EmployeeController],
  providers: [
    CreateEmployeeUseCase,
    ListEmployeesUseCase,
    {
      provide: 'EmployeeRepositoryPort',
      useClass: EmployeeTypeOrmRepository,
    },
  ],
  exports: [CreateEmployeeUseCase, ListEmployeesUseCase],
})
export class EmployeeModule {}