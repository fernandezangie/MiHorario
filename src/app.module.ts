import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/infrastructure/shared.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { EmployeeModule } from './employee/infrastructure/employee.module';
import { JobModule } from './job/infrastructure/job.module';
import { ShiftModule } from './shift/infrastructure/shift.module';
import { ZoneModule } from './zone/infrastructure/zone.module';
import { RestrictionModule } from './restriction/infrastructure/restriction.module';

@Module({
  imports: [
    DatabaseModule, // <-- Conexión a CockroachDB
    SharedModule,
    EmployeeModule,
    JobModule,
    ShiftModule,
    ZoneModule,
    RestrictionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}