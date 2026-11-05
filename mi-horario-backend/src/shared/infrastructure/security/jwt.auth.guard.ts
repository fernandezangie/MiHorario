import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly messageCatalogService: MessageCatalogService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar si la ruta o el controlador están marcados como públicos
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Ejecutar la validación de Passport-JWT (JwtStrategy contra Keycloak JWKS)
    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (err) {
      // 3. Si STRICT_AUTH está activo o falla la firma/expiración, lanzar excepción con mensaje de Redis
      if (process.env.STRICT_AUTH === 'true') {
        const errorMessage = await this.messageCatalogService.getMessage(
          'AUTH_BEARER_REQUIRED',
          'es',
        );
        throw new UnauthorizedException(errorMessage);
      }
      throw err;
    }
  }

  // Se ejecuta cuando Passport termina de procesar el token
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}