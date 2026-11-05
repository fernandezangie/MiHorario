import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Base de datos (PostgreSQL)
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('mi_horario_db'),
  DB_SSL: Joi.string().valid('true', 'false').optional(),
  DB_SYNC: Joi.string().valid('true', 'false').optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),

  // Caché (Redis)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USER: Joi.string().default('default'),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Seguridad
  JWT_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string()
        .min(16)
        .default('dev-only-secret-change-me-123456'),
    }),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  OIDC_ISSUER: Joi.string().default('https://accounts.google.com'),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(120),

  // Correo (Brevo)
  BREVO_API_KEY: Joi.string().allow('').optional(),
  MAIL_FROM_EMAIL: Joi.string().allow('').optional(),
  MAIL_FROM_NAME: Joi.string().allow('').optional(),

  // CORS
  CORS_ORIGIN: Joi.string().allow('').optional(),
}).unknown(true);
