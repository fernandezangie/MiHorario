import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly messageCatalogService: MessageCatalogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceId =
      request.headers['x-request-id'] || request.traceId || randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 1. Obtenemos por defecto el mensaje genérico desde Redis
    let message = 'Error interno procesando la solicitud en MiHorario.';
    try {
      const redisMessage = await this.messageCatalogService.getMessage(
        'INTERNAL_SERVER_ERROR',
        'es',
      );
      if (redisMessage) {
        message = redisMessage;
      }
    } catch (err) {
      this.logger.warn(
        `No se pudo consultar el catálogo de Redis en el filtro global: ${err.message}`,
      );
    }

    if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        message = await this.messageCatalogService
          .getMessage(res, 'es')
          .catch(() => res);
      } else if (Array.isArray(res?.message)) {
        const translated = await Promise.all(
          res.message.map((m: string) =>
            this.messageCatalogService.getMessage(m, 'es').catch(() => m),
          ),
        );
        message = translated.join(', ');
      } else if (res?.message) {
        message = await this.messageCatalogService
          .getMessage(res.message, 'es')
          .catch(() => res.message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${traceId}] Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
      );
      if (exception.message) {
        const translated = await this.messageCatalogService
          .getMessage(exception.message, 'es')
          .catch(() => exception.message);
        if (translated) {
          message = translated;
        }
      }
    }

    response.setHeader('X-Request-Id', traceId);
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      traceId,
      message,
    });
  }
}
