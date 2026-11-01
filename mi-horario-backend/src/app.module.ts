import { Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as net from 'net';
import * as fs from 'fs';

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
// Building Blocks Fundamentales: Seguridad JWT/RBAC, Auditoría Habeas Data, Salud y Trazabilidad
import { AuthModule } from './auth/infrastructure/auth.module';
import { AuditModule } from './audit/infrastructure/audit.module';
import { HealthModule } from './health/infrastructure/health.module';
import { RateLimitGuard } from '@shared/infrastructure/security/rate-limit.guard';
import { JwtAuthGuard } from '@shared/infrastructure/security/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/security/roles.guard';
import { GlobalExceptionFilter } from '@shared/infrastructure/filters/global-exception.filter';
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

/**
 * Obtiene la contraseña de la base de datos.
 * 1) Si DB_PASSWORD_FILE apunta a un archivo/directorio real (Docker Secret), lo lee.
 * 2) Si no, usa SOLO process.env.DB_PASSWORD.
 * Siempre retorna un string.
 */
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

    const envPass = process.env.DB_PASSWORD || '';

    if (!envPass) {
      bootLogger.error(
        '[SECRET_ERROR] DB_PASSWORD no está definida en el entorno del contenedor.',
      );
    } else {
      bootLogger.log(
        `[SECRET_FALLBACK] Usando DB_PASSWORD del entorno. Longitud: ${envPass.length}`,
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

/**
 * Determina si se debe usar SSL en la conexión a la base de datos.
 * - DB_SSL=false  -> sin SSL (Postgres local en Docker).
 * - DB_SSL=true   -> con SSL (CockroachDB Cloud u otro remoto).
 * - Sin definir   -> SSL solo si el host no es local.
 */
function resolveDbSsl(dbHost: string): false | { rejectUnauthorized: boolean } {
  const flag = (process.env.DB_SSL || '').toLowerCase();

  if (flag === 'false') return false;
  if (flag === 'true') return { rejectUnauthorized: false };

  const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
  return isLocal ? false : { rejectUnauthorized: false };
}

@Module({
  imports: [
    // 1. Configuración global de variables de entorno y validación (Building Block Secret Manager ADR-0001)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // 2. Caché con Redis y Fallback en Memoria Resiliente (TLS configurable por REDIS_TLS)
    CustomCacheModule,

    // 3. Conexión global a PostgreSQL / CockroachDB mediante TypeORM con detección preventiva
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
          synchronize: false,
          manualInitialization: !isDbUp,
        };
      },
    }),

    // 4. Registro de todos los módulos del MVP y Building Blocks Arquitectónicos
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
    // API Gateway Rate Limiter (ADR-0001 / ADR-0009)
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // Identity Provider JWT Validation Guard (ADR-0001 / ADR-0006)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RBAC Authorization Guard (ADR-0006 - ADMIN vs EMPLOYEE)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Exception Filter & Data Masking (ADR-0005 / OWASP)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Traceability & Audit Trail Interceptor (ADR-0005 / ADR-0006 / ADR-0011)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
