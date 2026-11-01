import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message.catalog.service';
import { MessageTestController } from './messaging/message.test.controller';
import { NotificationService } from './messaging/notification.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // --- DIAGNÓSTICO TEMPORAL (borrar después) ---
        console.log('MAIL_HOST:', config.get('MAIL_HOST'));
        console.log('MAIL_PORT:', config.get('MAIL_PORT'));
        console.log('MAIL_USER:', config.get('MAIL_USER'));
        console.log('MAIL_PASS definida:', !!config.get('MAIL_PASS'));
        // ---------------------------------------------

        return {
          transport: {
            host: config.get<string>('MAIL_HOST'),
            port: Number(config.get<string>('MAIL_PORT') ?? 587),
            secure: false, // false para 587 (STARTTLS), true para 465
            auth: {
              user: config.get<string>('MAIL_USER'),
              pass: config.get<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: '"MiHorario Notificaciones" <no-reply@mihorario.com>',
          },
        };
      },
    }),
  ],
  providers: [CacheService, MessageCatalogService, NotificationService],
  controllers: [MessageTestController],
  exports: [MessageCatalogService, CacheService, NotificationService],
})
export class SharedModule {}
