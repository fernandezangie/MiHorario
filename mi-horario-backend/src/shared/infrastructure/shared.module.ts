import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message-catalog.service';
import { MessageTestController } from './messaging/message-test.controller';
import { NotificationService } from './messaging/notification.service';

@Global() // <-- Esto hace que esté disponible en todo el backend de forma transversal
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.MAIL_USER || 'tu-correo@gmail.com',
          pass: process.env.MAIL_PASS || 'tu-contrasena-de-aplicacion',
        },
      },
      defaults: {
        from: '"MiHorario Notificaciones" <no-reply@mihorario.com>',
      },
    }),
  ],
  providers: [CacheService, MessageCatalogService, NotificationService],
  controllers: [MessageTestController],
  exports: [MessageCatalogService, CacheService, NotificationService],
})
export class SharedModule {}
