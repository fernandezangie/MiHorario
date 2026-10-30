import { getSecret } from './secret.loader';

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 26257,
    user: process.env.DB_USER,
    password: getSecret('DB_PASSWORD', 'DB_PASSWORD_FILE'),
    name: process.env.DB_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 11729,
    user: process.env.REDIS_USER || 'default',
    password: getSecret('REDIS_PASSWORD', 'REDIS_PASSWORD_FILE'),
    tls: process.env.REDIS_TLS === 'true',
  },
});
