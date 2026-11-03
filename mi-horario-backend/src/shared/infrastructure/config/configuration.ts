import { getSecret } from './secret.loader';

/**
 * Building Block: Secret Manager Configuration Loader (ADR-0001)
 * Centraliza la lectura de variables de entorno y archivos de secretos evitando el uso directo de process.env
 * disperso en las capas de dominio o aplicación.
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 26257,
    user: process.env.DB_USER || '',
    password: getSecret('DB_PASSWORD', 'DB_PASSWORD_FILE') || 'postgres',
    name: process.env.DB_NAME || 'mi_horario_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 11729,
    user: process.env.REDIS_USER || 'default',
    password: getSecret('REDIS_PASSWORD', 'REDIS_PASSWORD_FILE'),
    tls: process.env.REDIS_TLS === 'true',
    url: process.env.REDIS_URL,
  },
  security: {
    jwtSecret:
      getSecret('JWT_SECRET', 'JWT_SECRET_FILE') ||
      'comfama-mihorario-jwt-secret-key-2026-adr0006',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    googleClientId:
      process.env.GOOGLE_CLIENT_ID ||
      '407688951595-jhjhvthvriskj3c8q3goaamihg8q3a2o.apps.googleusercontent.com',
    oidcIssuer: process.env.OIDC_ISSUER || 'https://accounts.google.com',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    rateLimitMaxRequests:
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 120,
  },
});
