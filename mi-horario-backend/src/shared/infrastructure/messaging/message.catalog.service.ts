import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const DEFAULT_MESSAGES_ES: Record<string, string> = {
  EMPLOYEE_REGISTER_SUCCESS: 'Colaborador registrado exitosamente en la malla.',
  EMPLOYEE_EMAIL_INVALID: 'El formato del correo electrónico corporativo no es válido.',
  EMPLOYEE_CODE_DUPLICATE: 'Ya existe un colaborador registrado con ese código.',
  EMPLOYEE_ALREADY_EXISTS: 'Ya existe un colaborador registrado con el código {code}.',
  EMPLOYEE_NOT_FOUND: 'No se encontró ningún colaborador con el identificador {id}.',
  SHIFT_ASSIGN_SUCCESS: 'Turno asignado exitosamente al colaborador.',
  SHIFT_ACKNOWLEDGE_SUCCESS: 'Has confirmado tu asistencia para este turno.',
  SHIFT_UPDATE_SUCCESS: 'Horario, zona y trabajo actualizados correctamente en la malla.',
  SHIFT_OVERLAP_ERROR: 'El colaborador ya tiene un turno asignado que se cruza con ese horario.',
  SHIFT_REQUIRED_FIELDS: 'Los campos employeeId, startTime y endTime son obligatorios.',
  SHIFT_INVALID_DATE_FORMAT: 'El formato de las fechas del turno no es válido.',
  SHIFT_PAST_YEAR_MONTH: 'No se pueden asignar turnos en meses o años pasados.',
  SHIFT_PAST_DAY: 'No se puede asignar un turno en el día {diaTurno} porque es anterior al día actual ({diaActual}).',
  SHIFT_INVALID_END_TIME: 'La hora de finalización debe ser posterior a la hora de inicio.',
  SHIFT_OUT_OF_HOURS: 'El horario del turno debe estar entre las 06:00 y las 21:00.',
  JOB_CREATED_SUCCESS: 'Puesto de trabajo creado exitosamente.',
  ZONE_CREATED_SUCCESS: 'Zona operativa registrada exitosamente en el catálogo.',
  RESTRICTION_CREATED_SUCCESS: 'Restricción horaria registrada exitosamente.',
  WELCOME_EMAIL_SUBJECT: '¡Bienvenido(a) a MiHorario Comfama!',
  WELCOME_EMPLOYEE: 'Hola {name} (código {code}), tu perfil se encuentra {status} en la plataforma MiHorario.',
  NEW_SHIFT_EMAIL_SUBJECT: 'Se te ha asignado un nuevo turno en MiHorario ({startTime} - {endTime}).',
  INTERNAL_SERVER_ERROR: 'Error interno procesando la solicitud en MiHorario.',
};

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

      for (const [code, text] of Object.entries(DEFAULT_MESSAGES_ES)) {
        if (typeof client.hSetNX === 'function') {
          await client.hSetNX(hashKey, code, text);
        } else if (typeof client.hsetnx === 'function') {
          await client.hsetnx(hashKey, code, text);
        } else if (typeof client.hGet === 'function' && typeof client.hSet === 'function') {
          const existing = await client.hGet(hashKey, code);
          if (!existing) {
            await client.hSet(hashKey, code, text);
          }
        }
      }
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

      return message || DEFAULT_MESSAGES_ES[code] || code;
    } catch (error) {
      console.error('MESSAGE_ERROR:', error);
      return DEFAULT_MESSAGES_ES[code] || code;
    }
  }

  private formatMessage(message: string, args: Record<string, string>): string {
    return message.replace(/{(\w+)}/g, (_, key) => args[key] || `{${key}}`);
  }
}
