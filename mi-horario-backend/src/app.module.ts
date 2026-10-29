import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

// Importación de controladores y servicios raíz
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importación de los módulos del MVP de MiHorario usando alias con '@'
import { EmployeeModule } from '@employee/infrastructure/employee.module';
import { JobModule } from '@job/infrastructure/job.module';
import { ShiftModule } from '@shift/infrastructure/shift.module';
import { RestrictionModule } from '@restriction/infrastructure/restriction.module';
import { ZoneModule } from '@zone/infrastructure/zone.module';
import { SharedModule } from '@shared/infrastructure/shared.module';
import configuration from './shared/infrastructure/config/configuration';
import { validationSchema } from '@shared/infrastructure/config/environment.validation';

@Module({
  imports: [
    // 1. Configuración global de variables de entorno y validación
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
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

    // 4. Registro de todos los módulos del MVP (incluyendo SharedModule)
    EmployeeModule,
    JobModule,
    ShiftModule,
    RestrictionModule,
    ZoneModule,
    SharedModule,
  ],
  controllers: [AppController], // <-- ¡Añadido aquí!
  providers: [AppService],       // <-- ¡Añadido aquí!
})
export class AppModule {}