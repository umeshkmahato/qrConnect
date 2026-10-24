import { Injectable } from '@nestjs/common';
import {
  MembershipStatus,
  OrgRole,
  OrgStatus,
  OrganizationMembership,
  PlatformRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/auth.types';

export const STAFF_ROLES: OrgRole[] = [
  OrgRole.ORGANIZATION_OWNER,
  OrgRole.ORGANIZATION_ADMIN,
  OrgRole.SECURITY_GUARD,
];

export const ORG_MANAGE_ROLES: OrgRole[] = [OrgRole.ORGANIZATION_OWNER, OrgRole.ORGANIZATION_ADMIN];

/**
 * Centralized authorization policy.
 * Every sensitive decision goes through here — org-scoped roles are resolved
 * from membership records (never from the client or the token), organization
 * status is enforced, and deny is the default.
 */
@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  isPlatformAdmin(user: AuthUser | undefined | null): boolean {
    return user?.platformRole === PlatformRole.PLATFORM_SUPER_ADMIN;
  }

  /** Active, approved membership of a user in an org, or null. */
  async membership(userId: string, orgId: string): Promise<OrganizationMembership | null> {
    const m = await this.prisma.organizationMembership.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    return m && m.status === MembershipStatus.APPROVED ? m : null;
  }

  /** Memberships of a user across orgs (any status by default). */
  async membershipsOf(userId: string) {
    return this.prisma.organizationMembership.findMany({
      where: { userId },
      include: { org: { select: { id: true, name: true, type: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** All approved org ids for a user — used to scope list queries. */
  async approvedOrgIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.organizationMembership.findMany({
      where: { userId, status: MembershipStatus.APPROVED },
      select: { orgId: true },
    });
    return rows.map((r) => r.orgId);
  }

  async hasOrgRole(user: AuthUser, orgId: string, roles: OrgRole[]): Promise<boolean> {
    if (this.isPlatformAdmin(user)) return true;
    const m = await this.membership(user.id, orgId);
    return !!m && roles.includes(m.role);
  }

  async isOrgManager(user: AuthUser, orgId: string): Promise<boolean> {
    return this.hasOrgRole(user, orgId, ORG_MANAGE_ROLES);
  }

  async isStaff(user: AuthUser, orgId: string): Promise<boolean> {
    return this.hasOrgRole(user, orgId, STAFF_ROLES);
  }

  /** Org must be APPROVED for member-facing operations. Platform admin bypasses. */
  async orgIsActive(orgId: string): Promise<boolean> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { status: true },
    });
    return org?.status === OrgStatus.APPROVED;
  }

  /** Is the user an approved owner/authorized-user of the vehicle? */
  async isVehicleAssociate(userId: string, vehicleId: string): Promise<boolean> {
    const vm = await this.prisma.vehicleMembership.findUnique({
      where: { vehicleId_userId: { vehicleId, userId } },
    });
    return !!vm && vm.status === 'APPROVED';
  }

  /** Can the user manage the vehicle (owner association or org manager)? */
  async canManageVehicle(user: AuthUser, vehicleId: string, orgId: string): Promise<boolean> {
    if (this.isPlatformAdmin(user)) return true;
    if (await this.isOrgManager(user, orgId)) return true;
    const vm = await this.prisma.vehicleMembership.findUnique({
      where: { vehicleId_userId: { vehicleId, userId: user.id } },
    });
    return !!vm && vm.status === 'APPROVED' && vm.associationType === 'OWNER';
  }
}
