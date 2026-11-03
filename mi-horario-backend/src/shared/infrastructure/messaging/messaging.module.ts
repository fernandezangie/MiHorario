import { Module } from '@nestjs/common';
import { MessageCatalogService } from './message.catalog.service';
import { NotificationService } from './notification.service';
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module';

@Module({
  imports: [
    CustomCacheModule,
  ],
  providers: [
    MessageCatalogService,
    NotificationService,
  ],
  exports: [
    MessageCatalogService,
    NotificationService,
  ],
})
export class MessagingModule {}
