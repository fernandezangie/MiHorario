import { Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeeModule } from '@employee/infrastructure/employee.module';
import { JobModule } from '@job/infrastructure/job.module';
import { ShiftModule } from '@shift/infrastructure/shift.module';
import { RestrictionModule } from '@restriction/infrastructure/restriction.module';
import { ZoneModule } from '@zone/infrastructure/zone.module';
import { SharedModule } from '@shared/infrastructure/shared.module';
import configuration from './shared/infrastructure/config/configuration';
import { validationSchema } from '@shared/infrastructure/config/environment.validation';
import { CustomCacheModule } from '@shared/infrastructure/cache/cache.module';
import { AuthModule } from './auth/infrastructure/auth.module';
import { AuditModule } from './audit/infrastructure/audit.module';
import { HealthModule } from './health/infrastructure/health.module';
import { RateLimitGuard } from '@shared/infrastructure/security/rate.limit.guard';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt.auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { GlobalExceptionFilter } from '@shared/infrastructure/filters/global.exception.filter';
import { ValidationExceptionFilter } from '@shared/infrastructure/filters/validation.exception.filter';
import { LoggingInterceptor } from '@shared/infrastructure/interceptors/logging.interceptor';

const bootLogger = new Logger('AppModule-Bootstrap');

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

function getDatabasePassword(): string {
  try {
    const passwordPath = process.env.DB_PASSWORD_FILE;

    if (passwordPath && fs.existsSync(passwordPath)) {
      const stats = fs.statSync(passwordPath);

      if (stats.isDirectory()) {
        const files = fs.readdirSync(passwordPath);
        if (files.length > 0) {
          const pass = fs
            .readFileSync(`${passwordPath}/${files[0]}`, 'utf8')
            .trim();
          bootLogger.log(
            `[SECRET_SUCCESS] Contraseña leída desde directorio Docker Secret. Longitud: ${pass.length}`,
          );
          return pass;
        }
      }

      if (stats.isFile()) {
        const pass = fs.readFileSync(passwordPath, 'utf8').trim();
        bootLogger.log(
          `[SECRET_SUCCESS] Contraseña leída desde archivo Docker Secret. Longitud: ${pass.length}`,
        );
        return pass;
      }
    }

    // Soporte para variables estándar de entorno o Railway (DB_PASSWORD / PGPASSWORD)
    let envPass = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';

    // Si no hay ninguna de esas pero existe DATABASE_URL, intentamos extraer la contraseña
    if (!envPass && process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        envPass = decodeURIComponent(url.password);
      } catch (e) {
        // Ignorar error de parsing si la URL no es válida
      }
    }

    if (!envPass) {
      bootLogger.error(
        '[SECRET_ERROR] DB_PASSWORD / PGPASSWORD no está definida en el entorno.',
      );
    } else {
      bootLogger.log(
        `[SECRET_FALLBACK] Contraseña obtenida correctamente. Longitud: ${envPass.length}`,
      );
    }
    return envPass;
  } catch (error) {
    bootLogger.error(
      `[SECRET_ERROR] Error leyendo contraseña: ${error.message}`,
    );
    return '';
  }
}

function resolveDbSsl(dbHost: string): false | { rejectUnauthorized: boolean } {
  const flag = (process.env.DB_SSL || '').toLowerCase();

  if (flag === 'false') return false;
  if (flag === 'true') return { rejectUnauthorized: false };

  const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
  return isLocal ? false : { rejectUnauthorized: false };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    CustomCacheModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST') || 'localhost';
        const dbPort = parseInt(
          configService.get<string>('DB_PORT') || '5432',
          10,
        );
        const dbUser = configService.get<string>('DB_USER') || 'postgres';
        const dbName = configService.get<string>('DB_NAME') || 'mi_horario_db';

        const isDbUp = await checkTcpPortReachable(dbHost, dbPort);

        if (!isDbUp) {
          bootLogger.warn(
            `Base de datos (${dbHost}:${dbPort}) no detectada en este momento; iniciando servidor HTTP en modo autónomo (Building Blocks JWT/OIDC/Health/Audit activos).`,
          );
        }

        const ssl = resolveDbSsl(dbHost);

        bootLogger.log(
          `[DB_CONFIG] host=${dbHost} port=${dbPort} user=${dbUser} db=${dbName} ssl=${ssl ? 'on' : 'off'}`,
        );

        return {
          type: 'postgres' as const,
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: getDatabasePassword(),
          database: dbName,
          ssl,
          autoLoadEntities: true,
          synchronize: process.env.DB_SYNC === 'true',
          manualInitialization: !isDbUp,
        };
      },
    }),

    AuthModule,
    AuditModule,
    HealthModule,
    EmployeeModule,
    JobModule,
    ShiftModule,
    RestrictionModule,
    ZoneModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}