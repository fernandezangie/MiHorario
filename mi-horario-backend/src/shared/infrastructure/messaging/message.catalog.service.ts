import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MessageCatalogService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private getRedisClient(): any {
    const store: any = this.cacheManager.store;
    return (
      store.client ||
      (typeof store.getClient === 'function' ? store.getClient() : null)
    );
  }

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
      const client = this.getRedisClient();
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

  async getAllMessages(lang: string = 'es'): Promise<Record<string, string>> {
    try {
      const client = this.getRedisClient();
      if (!client) return {};

      const hashKey = `messages:${lang}`;
      const data =
        typeof client.hGetAll === 'function'
          ? await client.hGetAll(hashKey)
          : typeof client.hgetall === 'function'
            ? await client.hgetall(hashKey)
            : null;

      return data || {};
    } catch (error) {
      console.error('MESSAGE_ERROR:', error);
      return {};
    }
  }

  private formatMessage(message: string, args: Record<string, string>): string {
    return message.replace(/{(\w+)}/g, (_, key) => args[key] || `{${key}}`);
  }
}
