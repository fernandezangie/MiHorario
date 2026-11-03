import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../../audit/application/audit.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP-Traceability');

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    const traceId =
      (request.headers['x-request-id'] as string) || randomUUID();
    request.traceId = traceId;
    response.setHeader('X-Request-Id', traceId);

    const startTime = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode || 200;
        const user = request.user || {
          sub: 'ANON',
          code: 'ANON',
          name: 'Usuario Público',
          role: 'PUBLIC',
        };

        this.logger.log(
          JSON.stringify({
            traceId,
            method,
            url,
            statusCode,
            durationMs,
            actor: user.code,
            role: user.role,
          }),
        );

        // Registrar en bitácora inmutable (Habeas Data) cualquier operación de escritura
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.auditService.record({
            traceId,
            actorId: user.sub,
            actorCode: user.code,
            actorName: user.name,
            actorRole: user.role,
            action: `${method} ${url}`,
            resource: url,
            statusCode,
            durationMs,
            ipAddress: request.ip || '127.0.0.1',
            summary: `Operación ${method} ejecutada sobre ${url} por ${user.name} (${user.role})`,
          });
        }
      }),
    );
  }
}
