import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from '../application/auth.service';
import { UserOrmEntity } from './persistence/typeorm/user.orm.entity';
import { EmployeeOrmEntity } from '../../employee/infrastructure/persistence/typeorm/employee.orm.entity';
import { JwtTokenService } from '@shared/infrastructure/security/jwt.token.service';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt.auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { RateLimitGuard } from '@shared/infrastructure/security/rate.limit.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, EmployeeOrmEntity])],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    JwtAuthGuard,
    RolesGuard,
    RateLimitGuard,
  ],
  exports: [JwtTokenService, JwtAuthGuard, RolesGuard, RateLimitGuard],
})
export class AuthModule {}
