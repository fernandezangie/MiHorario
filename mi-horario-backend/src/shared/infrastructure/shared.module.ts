import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message.catalog.service';
import { MessageTestController } from './messaging/message.test.controller';
import { NotificationService } from './messaging/notification.service';
import { getSecret } from './config/secret.loader';

@Global()
@Module({
  imports: [
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
            secure: true, // true para el puerto 465 (Recomendado y estable para Gmail con SSL)
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
  providers: [CacheService, MessageCatalogService, NotificationService],
  controllers: [MessageTestController],
  exports: [MessageCatalogService, CacheService, NotificationService],
})
export class SharedModule { }
