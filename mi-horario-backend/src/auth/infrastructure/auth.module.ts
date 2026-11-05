import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from '../application/auth.service';
import { UserOrmEntity } from './persistence/typeorm/user.orm.entity';
import { EmployeeOrmEntity } from '../../employee/infrastructure/persistence/typeorm/employee.orm.entity';

// Importa el SharedModule que contiene MessageCatalogService y la seguridad
import { SharedModule } from '@shared/infrastructure/shared.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, EmployeeOrmEntity]),
    SharedModule, // <-- Resuelve la inyección de MessageCatalogService en AuthService
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
  ],
  exports: [
    AuthService,
  ],
})
export class AuthModule { }