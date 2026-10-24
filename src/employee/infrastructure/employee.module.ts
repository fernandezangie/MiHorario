import { Module } from '@nestjs/common';
import { EmployeeController } from '@employee/infrastructure/controllers/employee.controller';
import { CreateEmployeeUseCase } from '@employee/application/use-cases/create-employee.use-case';
import { IEmployeeRepository } from '@employee/domain/ports/employee.repository.port';
import { EmployeeInMemoryRepository } from '@employee/infrastructure/persistence/employee-in-memory.repository';

@Module({
  controllers: [EmployeeController],
  providers: [
    CreateEmployeeUseCase,
    {
      provide: IEmployeeRepository,
      useClass: EmployeeInMemoryRepository,
    },
  ],
  exports: [CreateEmployeeUseCase],
})
export class EmployeeModule {}