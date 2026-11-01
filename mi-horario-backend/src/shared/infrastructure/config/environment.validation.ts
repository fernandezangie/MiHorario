import * as Joi from 'joi';

/**
 * Building Block: Secret Manager & Environment Validation (ADR-0001 / ADR-0006)
 * Valida las variables de entorno al iniciar. Los secretos nunca van en el código:
 * las contraseñas llegan por *_FILE (Docker secrets) y el JWT_SECRET por entorno.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Base de Datos Relacional (PostgreSQL / CockroachDB - ADR-0002)
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('mi_horario_db'),
  DB_SSL: Joi.string().valid('true', 'false').optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_PASSWORD_FILE: Joi.string().allow('').optional(),

  // Caché Distribuido y Mensajería (Redis - ADR-0002 / ADR-0003)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USER: Joi.string().default('default'),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_PASSWORD_FILE: Joi.string().allow('').optional(),
  REDIS_URL: Joi.string().optional(),

  // Identidad: JWT + Google OpenID Connect (ADR-0001 / ADR-0006)
  // Obligatorio en producción; en desarrollo/test usa un valor de prueba.
  JWT_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('dev-only-jwt-secret-change-me'),
    }),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  OIDC_ISSUER: Joi.string().default('https://accounts.google.com'),

  // Rate limiting del API Gateway (ADR-0001 / ADR-0009)
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(120),
}).unknown(true);
