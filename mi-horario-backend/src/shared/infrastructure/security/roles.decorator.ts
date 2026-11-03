import { SetMetadata } from '@nestjs/common';

export type AppRole = 'ADMIN' | 'EMPLOYEE';
export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

