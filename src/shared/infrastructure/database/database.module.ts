import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'cockroachdb',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 26257,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME || 'defaultdb',
      synchronize: true, // Crea o actualiza las tablas automáticamente en desarrollo
      autoLoadEntities: true,
      ssl: {
        rejectUnauthorized: false, // Necesario para conexiones seguras con CockroachDB Cloud
      },
    }),
  ],
})
export class DatabaseModule {}