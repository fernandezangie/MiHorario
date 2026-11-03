import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLES_KEY } from './roles.decorator';

/**
 * RBAC Authorization Guard en Memoria (<1ms)
 * Verifica en memoria los claims `roles` del JWT sin consultar la base de datos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const userRoles: AppRole[] = Array.isArray(user?.roles)
      ? user.roles
      : user?.role
        ? [user.role]
        : [];

    const hasPermission = requiredRoles.some((reqRole) =>
      userRoles.includes(reqRole),
    );

    if (!user || !hasPermission) {
      throw new ForbiddenException(
        `Acceso denegado: Tu perfil (${userRoles.join(',') || 'ANÓNIMO'}) no tiene permisos para ejecutar esta operación.`,
      );
    }

    return true;
  }
}
