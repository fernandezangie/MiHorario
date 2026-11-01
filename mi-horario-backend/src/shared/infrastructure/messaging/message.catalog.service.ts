import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MessageCatalogService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getMessage(
    code: string,
    lang: string = 'es',
    args: Record<string, string> = {},
  ): Promise<string> {
    const message = await this.getMessageTemplate(code, lang);
    return this.formatMessage(message, args);
  }

  async getMessageTemplate(code: string, lang: string = 'es'): Promise<string> {
    try {
      const store: any = this.cacheManager.store;

      // Intentamos obtener el cliente subyacente de las formas compatibles con cache-manager-redis-yet
      const client =
        store.client ||
        (typeof store.getClient === 'function' ? store.getClient() : null);

      const hashKey = `messages:${lang}`;
      let message: string | null = null;

      if (client) {
        if (typeof client.hGet === 'function') {
          message = await client.hGet(hashKey, code);
        } else if (typeof client.hget === 'function') {
          message = await client.hget(hashKey, code);
        }
      }

      return message || code;
    } catch (error) {
      console.error('MESSAGE_ERROR:', error);
      return code;
    }
  }

  private formatMessage(message: string, args: Record<string, string>): string {
    return message.replace(/{(\w+)}/g, (_, key) => args[key] || `{${key}}`);
  }
}
