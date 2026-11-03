import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

interface RateRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateRecord>();
  private readonly windowMs =
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) || 60000;
  private readonly maxRequests =
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10) || 120;

  constructor(private readonly messageCatalogService: MessageCatalogService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 👈 Ahora es async por el await de Redis
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const ip =
      request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request.ip ||
      '127.0.0.1';

    const now = Date.now();
    const existing = this.buckets.get(ip);

    if (!existing || now > existing.resetAt) {
      this.buckets.set(ip, { count: 1, resetAt: now + this.windowMs });
      response.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      response.setHeader(
        'X-RateLimit-Remaining',
        (this.maxRequests - 1).toString(),
      );
      return true;
    }

    existing.count += 1;
    const remaining = Math.max(0, this.maxRequests - existing.count);
    response.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (existing.count > this.maxRequests) {
      const message = await this.messageCatalogService.getMessage(
        'RATE_LIMIT_EXCEEDED',
        'es',
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
