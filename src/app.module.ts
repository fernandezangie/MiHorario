import { Module } from '@nestjs/common';
import { EmployeeModule } from '@employee/infrastructure/employee.module';
import { JobModule } from '@job/infrastructure/job.module';

@Module({
  imports: [EmployeeModule, JobModule],
})
export class AppModule {}