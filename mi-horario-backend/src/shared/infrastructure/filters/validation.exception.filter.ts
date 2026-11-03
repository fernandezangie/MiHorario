import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service'; // 👈 Ajusta tu ruta si es necesario

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly messageCatalogService: MessageCatalogService) {}

  async catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    let messages = exceptionResponse.message;

    // Si class-validator devuelve un array de mensajes (errores de DTO)
    if (Array.isArray(messages)) {
      const translatedMessages = await Promise.all(
        messages.map(async (msgKey) => {
          try {
            // Intentamos traducir la llave usando Redis
            const translated = await this.messageCatalogService.getMessage(
              msgKey,
              'es',
            );
            return translated || msgKey; // Si no existe en Redis, devuelve la llave original por seguridad
          } catch {
            return msgKey;
          }
        }),
      );
      exceptionResponse.message = translatedMessages;
    } else if (typeof messages === 'string') {
      try {
        const translated = await this.messageCatalogService.getMessage(
          messages,
          'es',
        );
        if (translated) {
          exceptionResponse.message = translated;
        }
      } catch {}
    }

    response.status(status).json(exceptionResponse);
  }
}
