import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Building Block: Global Exception Filter & Data Masking (ADR-0005 / ADR-0006)
 * Estandariza todas las respuestas de error y oculta trazas internas de SQL/infraestructura
 * para cumplir con OWASP y Ley 1581 de 2012 (Habeas Data).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceId =
      request.headers['x-request-id'] || request.traceId || randomUUID();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error interno procesando la solicitud en MiHorario.';
    if (exception instanceof HttpException) {
      const res: any = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : Array.isArray(res?.message)
          ? res.message.join(', ')
          : res?.message || exception.message;
    } else if (exception instanceof Error) {
      // Se registra internamente el detalle técnico pero nunca se expone el stacktrace SQL al cliente
      this.logger.error(
        `[${traceId}] Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
      );
      message = exception.message || message;
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

