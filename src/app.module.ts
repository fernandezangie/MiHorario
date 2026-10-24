import { Module } from '@nestjs/common';
import { EmployeeModule } from '@employee/infrastructure/employee.module';

@Module({
  imports: [EmployeeModule],
})
export class AppModule {}