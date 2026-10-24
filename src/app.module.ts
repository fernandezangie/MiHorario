import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeeModule } from './employee/infrastructure/employee.module';
import { JobModule } from './job/infrastructure/job.module';
import { ShiftModule } from './shift/infrastructure/shift.module';

@Module({
  imports: [
    EmployeeModule,
    JobModule,
    ShiftModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}