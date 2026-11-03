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
        message = res;
      } else if (Array.isArray(res?.message)) {
        message = res.message.join(', ');
      } else if (res?.message) {
        message = res.message;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${traceId}] Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
      );
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
