export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
  jwtSecret: process.env.JWT_SECRET || 'super_secret_key_mihorario',
});