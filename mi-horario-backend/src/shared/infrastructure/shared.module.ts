import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { MessageCatalogService } from './messaging/message.catalog.service';
import { MessageTestController } from './messaging/message.test.controller';
import { NotificationService } from './messaging/notification.service';
import { BrevoMailService } from './messaging/brevo.mail.service';

@Global()
@Module({
  providers: [
    CacheService,
    MessageCatalogService,
    BrevoMailService,
    NotificationService,
  ],
  controllers: [MessageTestController],
  exports: [MessageCatalogService, CacheService, NotificationService],
})
export class SharedModule {}
