import { Module } from '@nestjs/common';
import { EmployeeController } from '@employee/infrastructure/controllers/employee.controller';
import { CreateEmployeeUseCase } from '@employee/application/usecases/create.employee.use.case';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { EmployeeInMemoryRepository } from '@employee/infrastructure/persistence/employee-in-memory.repository';

@Module({
  controllers: [EmployeeController],
  providers: [
    CreateEmployeeUseCase,
    {
      provide: 'EmployeeRepositoryPort',
      useClass: EmployeeInMemoryRepository,
    },
  ],
  exports: [CreateEmployeeUseCase],
})
export class EmployeeModule {}