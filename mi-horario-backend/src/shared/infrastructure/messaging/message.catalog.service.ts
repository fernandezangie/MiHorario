import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MessageCatalogService implements OnModuleInit {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    await this.seedMessagesToRedis();
  }

  private async seedMessagesToRedis() {
    try {
      const store: any = this.cacheManager.store;
      const client =
        store.client ||
        (typeof store.getClient === 'function' ? store.getClient() : null);

      if (!client) {
        return;
      }

      const lang = 'es';
      const hashKey = `messages:${lang}`;

    } catch (error) {
      console.error('Error al inicializar el catálogo en Redis:', error);
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

  async getMessageTemplate(code: string, lang: string = 'es'): Promise<string> {
    try {
      const store: any = this.cacheManager.store;

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
