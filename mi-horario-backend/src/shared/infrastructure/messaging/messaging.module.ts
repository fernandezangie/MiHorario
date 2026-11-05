import { Module } from '@nestjs/common';
import { MessageCatalogService } from './message.catalog.service';
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module';

@Module({
  imports: [
    CustomCacheModule,
  ],
  providers: [
    MessageCatalogService,

  ],
  exports: [
    MessageCatalogService,

  ],
})
export class MessagingModule {}
