import { Injectable } from '@nestjs/common';
import { CacheService } from '@shared/infrastructure/cache/cache.service';

@Injectable()
export class MessageCatalogService {
  constructor(private readonly cacheService: CacheService) {}

  async getMessageTemplate(code: string): Promise<string> {
    const cacheKey = `catalog:message:${code}`;

    // 1. Intentar obtener la plantilla desde Redis Cloud
    const cachedTemplate = await this.cacheService.get<string>(cacheKey);
    if (cachedTemplate) {
      return cachedTemplate;
    }

    // 2. Si no está en caché, buscar en el catálogo predefinido o base de datos
    const template = this.findTemplateInStore(code);

    // 3. Guardar en Redis Cloud con un tiempo de vida (ej. 24 horas = 86400000 ms)
    await this.cacheService.set(cacheKey, template, 86400000);

    return template;
  }

  private findTemplateInStore(code: string): string {
    const catalog: Record<string, string> = {
      EMPLOYEE_CREATED: 'El empleado {employeeName} ha sido registrado exitosamente.',
      SHIFT_ASSIGNED: 'Hola {employeeName}, tienes un nuevo turno asignado para el día {date}.',
      RESTRICTION_VIOLATION: 'Alerta: Se detectó una infracción de restricción laboral para {employeeName}.',
    };

    return catalog[code] || 'Plantilla de mensaje no encontrada en el catálogo.';
  }
}