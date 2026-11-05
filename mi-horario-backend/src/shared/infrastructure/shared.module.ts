import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message.catalog.service';
import { MessageTestController } from './messaging/message.test.controller';
import { NotificationService } from './messaging/notification.service';
import { BrevoMailService } from './messaging/brevo.mail.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './security/jwt.strategy';
import { JwtAuthGuard } from './security/jwt.auth.guard';
import { RolesGuard } from './security/roles.guard';
import { JwtTokenService } from './security/jwt.token.service';

@Global()
@Module({
  imports: [
    // 1. Registro global de la estrategia JWT de Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [
    CacheService,
    MessageCatalogService,
    NotificationService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    BrevoMailService,
    JwtTokenService,
  ],
  controllers: [MessageTestController],
  exports: [
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    JwtTokenService,
    MessageCatalogService,
    CacheService,
    NotificationService,
  ],
})
export class SharedModule { }
