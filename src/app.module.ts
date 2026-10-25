import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

// Importación de los módulos del MVP de MiHorario
import { EmployeeModule } from './employee/infrastructure/employee.module';
import { JobModule } from './job/infrastructure/job.module';
import { ShiftModule } from './shift/infrastructure/shift.module';
import { RestrictionModule } from './restriction/infrastructure/restriction.module';
import { ZoneModule } from './zone/infrastructure/zone.module';

@Module({
  imports: [
    // 1. Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configuración global de Redis Cache con Redis Cloud
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: parseInt(configService.get<string>('REDIS_PORT'), 10),
          },
          username: 'default',
          password: configService.get<string>('REDIS_PASSWORD'),
        }),
        ttl: 300000, // 5 minutos por defecto en milisegundos
      }),
    }),

    // 3. Conexión global a CockroachDB Cloud mediante TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '26257', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        ssl: {
          rejectUnauthorized: false,
        },
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // 4. Registro de todos los módulos del MVP
    EmployeeModule,
    JobModule,
    ShiftModule,
    RestrictionModule,
    ZoneModule,
  ],
})
export class AppModule {}