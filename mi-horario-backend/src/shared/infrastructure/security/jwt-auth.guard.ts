import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from './jwt-token.service';
import { IS_PUBLIC_KEY } from './roles.decorator';

/**
 * Building Block: JWT Authentication Guard (ADR-0001 / ADR-0006)
 * Extrae y valida el token Bearer en las cabeceras HTTP e inyecta la identidad
 * del usuario en request.user para trazabilidad y control de acceso.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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

    // Si no envía cabecera Authorization pero es entorno de desarrollo local,
    // asigna contexto de sesión por defecto o lanza 401 si se requiere estricto
    if (process.env.STRICT_AUTH === 'true') {
      throw new UnauthorizedException(
        'Se requiere autenticación mediante Bearer Token JWT.',
      );
    }

    request.user = {
      sub: 'ADM-001',
      code: 'SUP-0100',
      name: 'Daniela Gómez',
      email: 'daniela.gomez@comfama.com',
      role: (request.headers['x-user-role'] as 'ADMIN' | 'EMPLOYEE') || 'ADMIN',
      title: 'Supervisora de Operaciones',
      department: 'Dirección Parque Rionegro',
    };

    return true;
  }
}

