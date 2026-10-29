import { Module } from '@nestjs/common';
import { MessageCatalogService } from './message-catalog.service';
import { CacheService } from '@shared/infrastructure/cache/cache.service'; // Asegúrate de importar el módulo que provee CacheService

@Module({
  imports: [CacheService], // Dependencia del módulo de caché
  providers: [MessageCatalogService],
  exports: [MessageCatalogService], // Exportado para que otros dominios puedan inyectarlo
})
export class MessagingModule {}