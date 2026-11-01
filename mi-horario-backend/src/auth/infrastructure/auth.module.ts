import { Global, Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { JwtTokenService } from '@shared/infrastructure/security/jwt-token.service';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { RateLimitGuard } from '@shared/infrastructure/security/rate-limit.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [JwtTokenService, JwtAuthGuard, RolesGuard, RateLimitGuard],
  exports: [JwtTokenService, JwtAuthGuard, RolesGuard, RateLimitGuard],
})
export class AuthModule {}

