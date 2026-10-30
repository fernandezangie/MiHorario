import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const useTls = configService.get<boolean>('redis.tls');

        const store = await redisStore({
          socket: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
            ...(useTls ? { tls: true, rejectUnauthorized: false } : {}),
          } as any,
          username: configService.get<string>('redis.user'),
          password: configService.get<string>('redis.password'),
        });

        return {
          store: () => store as any,
          ttl: 300000,
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CustomCacheModule {}
