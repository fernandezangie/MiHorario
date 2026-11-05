import { getSecret } from './secret.loader';

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: getSecret('DB_PASSWORD', 'DB_PASSWORD_FILE') || 'postgres',
    name: process.env.DB_NAME || 'mi_horario_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    user: process.env.REDIS_USER || 'default',
    password: getSecret('REDIS_PASSWORD', 'REDIS_PASSWORD_FILE'),
    tls: process.env.REDIS_TLS === 'true',
    url: process.env.REDIS_URL,
  },
  security: {
    jwtSecret: getSecret('JWT_SECRET', 'JWT_SECRET_FILE'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    oidcIssuer: process.env.OIDC_ISSUER || 'https://accounts.google.com',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    rateLimitMaxRequests:
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 120,
  },
  mail: {
    brevoApiKey: process.env.BREVO_API_KEY || '',
    fromEmail: process.env.MAIL_FROM_EMAIL || '',
    fromName: process.env.MAIL_FROM_NAME || 'Mi Horario',
  },
});
