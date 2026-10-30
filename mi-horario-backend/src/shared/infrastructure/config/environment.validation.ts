import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(26257),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_PASSWORD_FILE: Joi.string().allow('').optional(),
  DB_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(11729),
  REDIS_USER: Joi.string().optional(),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_PASSWORD_FILE: Joi.string().allow('').optional(),
});
