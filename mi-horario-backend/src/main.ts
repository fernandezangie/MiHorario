import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS con soporte de credenciales (Cookie HttpOnly de Refresh Token - ADR-0005 Paso 2)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /**
   * Paso 3 de ADR-0005 (Líneas 46-51): Blindaje Perimetral contra Inyecciones (OWASP A03)
   * y Mass Assignment mediante las 3 políticas obligatorias del ValidationPipe:
   * 1. whitelist: true -> Descarta propiedades no declaradas en el DTO.
   * 2. forbidNonWhitelisted: true -> Lanza 400 Bad Request inmediato si envían campos intrusos (ej. "roles": ["ADMIN"]).
   * 3. transform: true -> Coerción estricta de tipos contra Type Juggling.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;

  // Escuchar en 0.0.0.0 es obligatorio para que Cloud Run, Render y Docker acepten el tráfico externo
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
