import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marks an endpoint as not requiring authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ORG_ROLES_KEY = 'orgRoles';
/** Required org-scoped roles; evaluated against the resolved organization context. */
export const Roles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

export const PLATFORM_ADMIN_KEY = 'platformAdmin';
/** Requires PLATFORM_SUPER_ADMIN. */
export const PlatformAdmin = () => SetMetadata(PLATFORM_ADMIN_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);

export const RequestIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.ip;
  },
);
