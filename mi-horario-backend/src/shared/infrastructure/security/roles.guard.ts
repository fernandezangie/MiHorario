import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLES_KEY } from './roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly messageCatalogService: MessageCatalogService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    console.log('RolesGuard -> request.user:', JSON.stringify(request.user));
    const user = request.user;

    const rawRoles =
      user?.roles ||
      user?.realm_access?.roles ||
      user?.rawPayload?.realm_access?.roles ||
      (user?.role ? [user.role] : []);

    const userRoles: AppRole[] = Array.isArray(rawRoles) ? rawRoles : [];

    const hasPermission = requiredRoles.some((reqRole) =>
      userRoles.includes(reqRole),
    );

    if (!user || !hasPermission) {
      const rolesString = userRoles.length > 0 ? userRoles.join(', ') : 'ANÓNIMO';

      const message = await this.messageCatalogService.getMessage(
        'ROLE_ACCESS_DENIED',
        'es',
        { userRoles: rolesString },
      );

      throw new ForbiddenException(message);
    }

    return true;
  }
}
