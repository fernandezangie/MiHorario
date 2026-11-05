import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const REDIS_TIMEOUT_MS = 2000;

@Injectable()
export class MessageCatalogService {
  private readonly logger = new Logger(MessageCatalogService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getRedisClient(): any {
    const store: any = this.cacheManager.store;
    return (
      store?.client ||
      (typeof store?.getClient === 'function' ? store.getClient() : null)
    );
  }

  /** Ejecuta la operación con tiempo máximo; si falla o tarda, devuelve el respaldo */
  private async withTimeout<T>(op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await Promise.race([
        op(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`timeout de ${REDIS_TIMEOUT_MS} ms`)),
            REDIS_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Catálogo de mensajes no disponible: ${message}`);
      return fallback;
    }
  }

  async getMessage(
    code: string,
    lang: string = 'es',
    args: Record<string, string> = {},
  ): Promise<string> {
    const message = await this.getMessageTemplate(code, lang);
    return this.formatMessage(message, args);
  }

  /**
   * Devuelve el texto de la plantilla. Si Redis no responde o el código
   * no existe, devuelve el propio código (comportamiento original).
   */
  async getMessageTemplate(code: string, lang: string = 'es'): Promise<string> {
    const client = this.getRedisClient();
    if (!client || client.isReady === false) return code;

    const hashKey = `messages:${lang}`;
    const message = await this.withTimeout<string | null>(async () => {
      if (typeof client.hGet === 'function') return client.hGet(hashKey, code);
      if (typeof client.hget === 'function') return client.hget(hashKey, code);
      return null;
    }, null);

    return message || code;
  }

  async getAllMessages(lang: string = 'es'): Promise<Record<string, string>> {
    const client = this.getRedisClient();
    if (!client || client.isReady === false) return {};

    const hashKey = `messages:${lang}`;
    const data = await this.withTimeout<Record<string, string> | null>(
      async () => {
        if (typeof client.hGetAll === 'function')
          return client.hGetAll(hashKey);
        if (typeof client.hgetall === 'function')
          return client.hgetall(hashKey);
        return null;
      },
      null,
    );
    return data || {};
  }

  private formatMessage(message: string, args: Record<string, string>): string {
    if (!message) return '';
    return message.replace(/{(\w+)}/g, (_, key) => args[key] || `{${key}}`);
  }
}
