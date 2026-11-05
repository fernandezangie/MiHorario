import { Logger, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import * as net from 'net';
import { CacheService } from './cache.service';
import { ParameterCatalogService } from './parameter.catalog.service';

const cacheLogger = new Logger('CustomCacheModule');

function checkTcpPortReachable(
  host: string,
  port: number,
  timeoutMs = 3000,
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
        const host =
          configService.get<string>('redis.host') ||
          process.env.REDIS_HOST ||
          process.env.REDISHOST ||
          'localhost';

        const port = Number(
          configService.get<number>('redis.port') ||
            process.env.REDIS_PORT ||
            process.env.REDISPORT ||
            6379,
        );

        let password =
          configService.get<string>('redis.password') ||
          process.env.REDIS_PASSWORD ||
          process.env.REDISPASSWORD;

        // Si Railway provee una URL completa (REDIS_URL), extraer la contraseña
        if (!password && process.env.REDIS_URL) {
          try {
            const url = new URL(process.env.REDIS_URL);
            password = decodeURIComponent(url.password);
          } catch (e) {
            // Ignorar si la URL no es válida
          }
        }

        const isRedisUp = await checkTcpPortReachable(host, port);

        // MODO TOLERANTE: sin Redis, el backend arranca con caché en memoria
        if (!isRedisUp) {
          cacheLogger.warn(
            `Redis (${host}:${port}) no disponible. Se usa caché en memoria; el catálogo de mensajes usará los textos de respaldo.`,
          );
          return { ttl: 300000 }; // sin "store": caché en memoria
        }

        try {
          const store = await redisStore({
            socket: {
              host,
              port,
              tls: false,
              // Reintenta cada 0,5 s, aumentando hasta un máximo de 5 s
              reconnectStrategy: (retries: number) =>
                Math.min(retries * 500, 5000),
            } as any,
            username:
              configService.get<string>('redis.user') ||
              process.env.REDIS_USER ||
              'default',
            password,
          });

          // Evita que un corte de Redis tumbe el proceso por un error sin manejar
          (store as any).client?.on?.('error', (err: Error) => {
            cacheLogger.warn(`Redis: ${err.message}`);
          });

          return {
            store: () => store as any,
            ttl: 300000,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          cacheLogger.warn(
            `No se pudo conectar a Redis (${message}). Se usa caché en memoria.`,
          );
          return { ttl: 300000 };
        }
      },
    }),
  ],
  providers: [CacheService, ParameterCatalogService],
  exports: [CacheService, ParameterCatalogService, CacheModule],
})
export class CustomCacheModule {}
