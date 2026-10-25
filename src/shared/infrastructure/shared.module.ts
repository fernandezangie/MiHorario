import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { EventBusService } from './messaging/event-bus.service';

@Global()
@Module({
  providers: [CacheService, EventBusService],
  exports: [CacheService, EventBusService],
})
export class SharedModule {}