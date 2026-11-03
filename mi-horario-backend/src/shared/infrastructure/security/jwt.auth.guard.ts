import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from './jwt.token.service';
import { IS_PUBLIC_KEY } from './roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service'; // 👈 Importamos el servicio

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
    private readonly messageCatalogService: MessageCatalogService, // 👈 Lo inyectamos aquí
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 👈 Ahora es async
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        request.user = this.jwtTokenService.verify(token);
        return true;
      } catch (err) {
        if (!isPublic) {
          throw err;
        }
      }
    }

    if (isPublic) {
      return true;
    }

    if (process.env.STRICT_AUTH === 'true') {
      const errorMessage = await this.messageCatalogService.getMessage(
        'AUTH_BEARER_REQUIRED',
        'es',
      );

      throw new UnauthorizedException(errorMessage);
    }

    return true;
  }
}
