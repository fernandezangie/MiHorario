import { Logger, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import * as net from 'net';
import { CacheService } from './cache.service';
import { ParameterCatalogService } from './parameter-catalog.service'; // <-- Importado

const cacheLogger = new Logger('CustomCacheModule');

function checkTcpPortReachable(
  host: string,
  port: number,
  timeoutMs = 1200,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(timeoutMs);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('redis.host') || 'localhost';
        const port = configService.get<number>('redis.port') || 11729;
        const useTls = configService.get<boolean>('redis.tls');
        const isRedisUp = await checkTcpPortReachable(host, port);

        if (isRedisUp) {
          try {
            const store = await redisStore({
              socket: {
                host,
                port,
                ...(useTls ? { tls: true, rejectUnauthorized: false } : {}),
              } as any,
              username: configService.get<string>('redis.user'),
              password: configService.get<string>('redis.password'),
            });

            return {
              store: () => store as any,
              ttl: 300000,
            };
          } catch {
            cacheLogger.warn(
              'No fue posible autenticar en Redis; activando caché en memoria de respaldo.',
            );
          }
        } else {
          cacheLogger.warn(
            `Redis (${host}:${port}) no detectado; activando caché en memoria de respaldo.`,
          );
        }

        return {
          ttl: 300000,
        };
      },
    }),
  ],
  providers: [CacheService, ParameterCatalogService], // <-- Añadido a los providers
  exports: [CacheService, ParameterCatalogService, CacheModule], // <-- Exportado para otros módulos
})
export class CustomCacheModule {}
