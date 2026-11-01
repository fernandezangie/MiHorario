import { Module } from '@nestjs/common';
import { MessageCatalogService } from './message.catalog.service';
import { NotificationService } from './notification.service';
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module'; // 👈 Importa el MÓDULO de caché, no el servicio

@Module({
  imports: [
    CustomCacheModule, // ✅ Correcto: Se importa el módulo completo
  ],
  providers: [
    MessageCatalogService,
    NotificationService, // Asegúrate de incluir tu servicio de notificaciones aquí también si vive en esta carpeta
  ],
  exports: [
    MessageCatalogService,
    NotificationService, // Exportado para que otros módulos (como ShiftModule o EmployeeModule) puedan usarlo
  ],
})
export class MessagingModule {}
