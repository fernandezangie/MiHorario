import { SetMetadata } from '@nestjs/common';

export type AppRole = 'ADMIN' | 'EMPLOYEE';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador RBAC (Role-Based Access Control)
 * Define qué roles están autorizados para invocar un endpoint específico.
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Marca un endpoint como público (ej. /health o /auth/login).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

