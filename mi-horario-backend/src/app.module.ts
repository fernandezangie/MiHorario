import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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

// Módulo de caché con Redis (único punto de configuración de Redis)
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module';

@Module({
  imports: [
    // 1. Configuración global de variables de entorno y validación
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // 2. Caché con Redis Cloud (TLS configurable por REDIS_TLS)
    CustomCacheModule,

    // 3. Conexión global a CockroachDB Cloud mediante TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '26257', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('database.password'),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
