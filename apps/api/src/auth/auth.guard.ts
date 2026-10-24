import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';
import { AccessTokenPayload, AuthUser } from './auth.types';
import { env } from '../config/env';

/**
 * Verifies the access JWT, loads the user, and enforces account status.
 * Roles and org permissions are deliberately NOT trusted from the token —
 * they are resolved server-side per request by the authorization layer.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      if (isPublic) return true;
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Missing access token' });
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(header.slice(7), {
        secret: env.jwtAccessSecret(),
      });
      if (payload.type !== 'access') throw new Error('bad token type');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
      }
      const authUser: AuthUser = {
        id: user.id,
        phone: user.phone,
        status: user.status,
        platformRole: user.platformRole,
      };
      req.user = authUser;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      if (isPublic) return true;
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
    }
  }
}
