import { Logger, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { CacheService } from './cache.service';
import { ParameterCatalogService } from './parameter.catalog.service';

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
        const isRedisUp = await checkTcpPortReachable(host, port);

        // Leer la contraseña desde el archivo en la carpeta secrets/redis_password.txt
        let password = configService.get<string>('redis.password');
        try {
          const secretFilePath = path.resolve(
            process.cwd(),
            'secrets',
            'redis_password.txt',
          );
          if (fs.existsSync(secretFilePath)) {
            password = fs.readFileSync(secretFilePath, 'utf8').trim();
          }
        } catch (err) {
          cacheLogger.warn(
            'No se pudo leer el archivo secrets/redis_password.txt, usando fallback de configuración.',
          );
        }

        // MODO ESTRICTO: Si Redis no está disponible, bloqueamos y lanzamos error fatal
        if (!isRedisUp) {
          cacheLogger.error(
            `[FATAL] Redis (${host}:${port}) no está disponible. El sistema requiere Redis obligatorio para el catálogo de mensajes.`,
          );
          throw new Error(`Redis connection failed: ${host}:${port} is unreachable.`);
        }

        try {
          const store = await redisStore({
            socket: {
              host,
              port,
              tls: false,
            } as any,
            username: configService.get<string>('redis.user') || 'default',
            password: password,
          });

          return {
            store: () => store as any,
            ttl: 300000,
          };
        } catch (error) {
          cacheLogger.error(
            `[FATAL] Error de autenticación o conexión con Redis: ${error.message}`,
          );
          throw new Error(`Redis authentication/connection failed: ${error.message}`);
        }
      },
    }),
  ],
  providers: [CacheService, ParameterCatalogService],
  exports: [CacheService, ParameterCatalogService, CacheModule],
})
export class CustomCacheModule {}