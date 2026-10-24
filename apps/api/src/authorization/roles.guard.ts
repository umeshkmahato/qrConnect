import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';
import { ORG_ROLES_KEY, PLATFORM_ADMIN_KEY } from '../common/decorators';
import { PolicyService } from './policy.service';
import { AuthUser } from '../auth/auth.types';

/**
 * Enforces @PlatformAdmin() and @Roles(...). For org roles, the org id is
 * resolved from the `:orgId` route param (controllers may also set
 * `req.resolvedOrgId` after loading a resource).
 * Deny by default.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policy: PolicyService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;

    const platformAdmin = this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const roles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!platformAdmin && (!roles || roles.length === 0)) return true;
    if (!user) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }

    if (this.policy.isPlatformAdmin(user)) return true;
    if (platformAdmin) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Platform admin required' });
    }

    const orgId: string | undefined = req.resolvedOrgId ?? req.params.orgId ?? req.params.id;
    if (!orgId) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Organization context required' });
    }
    const ok = await this.policy.hasOrgRole(user, orgId, roles ?? []);
    if (!ok) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient organization role' });
    }
    return true;
  }
}
