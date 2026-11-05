import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const CACHE_TIMEOUT_MS = 2000;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  
  private async safe<R>(
    label: string,
    operation: () => Promise<R>,
    fallback: R,
  ): Promise<R> {
    try {
      return await Promise.race([
        operation(),
        new Promise<R>((_, reject) =>
          setTimeout(
            () => reject(new Error(`timeout de ${CACHE_TIMEOUT_MS} ms`)),
            CACHE_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Caché no disponible (${label}): ${message}`);
      return fallback;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.safe(
      `get ${key}`,
      () => this.cacheManager.get<T>(key),
      undefined,
    );
    return value ?? null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.safe(
      `set ${key}`,
      () => this.cacheManager.set(key, value, ttl),
      undefined,
    );
  }

  async delete(key: string): Promise<void> {
    await this.safe(`del ${key}`, () => this.cacheManager.del(key), undefined);
  }

  async del(key: string): Promise<void> {
    await this.delete(key);
  }
}
