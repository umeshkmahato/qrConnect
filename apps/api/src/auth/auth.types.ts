import { PlatformRole, UserStatus } from '@prisma/client';

/** Authenticated principal attached to the request by AuthGuard. */
export interface AuthUser {
  id: string;
  phone: string;
  status: UserStatus;
  platformRole: PlatformRole | null;
}

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}
