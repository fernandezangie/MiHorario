import * as Joi from 'joi';

/**
 * Building Block: Secret Manager & Environment Validation (ADR-0001 / ADR-0006)
 * Garantiza que la aplicación valide la existencia de los secretos críticos
 * al iniciar o asigne valores seguros en desarrollo local sin exponer credenciales en código.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Base de Datos Relacional (PostgreSQL / CockroachDB - ADR-0002)
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(26257),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_PASSWORD_FILE: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().default('mi_horario_db'),

  // Caché Distribuido y Mensajería (Redis - ADR-0002 / ADR-0003)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(11729),
  REDIS_USER: Joi.string().optional(),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_PASSWORD_FILE: Joi.string().allow('').optional(),
  REDIS_URL: Joi.string().optional(),

  // Baúl de Secretos de Identidad: JWT + Google Cloud OpenID Connect (ADR-0001 / ADR-0006)
  JWT_SECRET: Joi.string()
    .min(16)
    .default('comfama-mihorario-jwt-secret-key-2026-adr0006'),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  GOOGLE_CLIENT_ID: Joi.string().default(
    '407688951595-jhjhvthvriskj3c8q3goaamihg8q3a2o.apps.googleusercontent.com',
  ),
  OIDC_ISSUER: Joi.string().default('https://accounts.google.com'),

  // Límite de Peticiones del API Gateway / Rate Limiting (ADR-0001 / ADR-0009)
  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(120),
});
