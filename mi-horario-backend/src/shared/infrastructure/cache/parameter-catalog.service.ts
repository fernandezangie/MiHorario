import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';

@Injectable()
export class ParameterCatalogService {
  private readonly PREFIX = 'catalog:parameters:';
  private readonly DEFAULT_TTL = 86400; // 24 horas en segundos

  constructor(private readonly cacheService: CacheService) {}

  async setParameter(key: string, value: any): Promise<void> {
    await this.cacheService.set(
      `${this.PREFIX}${key}`,
      value,
      this.DEFAULT_TTL,
    );
  }

  async getParameter<T>(key: string): Promise<T | null> {
    return await this.cacheService.get<T>(`${this.PREFIX}${key}`);
  }

  // Inicializar parámetros por defecto basados en normativas o restricciones
  async loadDefaultParameters(): Promise<void> {
    await this.setParameter('max_weekly_hours', 48); // Ley laboral en Colombia
    await this.setParameter('min_rest_hours', 11); // Descanso mínimo entre turnos
    await this.setParameter('max_distance_km', 30); // Distancia máxima entre zonas asignadas
  }
}
