import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message.catalog.service';
import { MessageTestController } from './messaging/message.test.controller';
import { NotificationService } from './messaging/notification.service';
import { getSecret } from './config/secret.loader';
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

    // Configuración existente de correo
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mailPass =
          getSecret('MAIL_PASS', 'MAIL_PASS_FILE') ||
          config.get<string>('MAIL_PASS');
        return {
          transport: {
            host: config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
            port: Number(config.get<string>('MAIL_PORT') ?? 465),
            secure: true,
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: mailPass,
            },
          },
          defaults: {
            from: `"MiHorario Notificaciones" <${config.get<string>('MAIL_USER')}>`,
          },
        };
      },
    }),
  ],
  providers: [
    CacheService,
    MessageCatalogService,
    NotificationService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
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