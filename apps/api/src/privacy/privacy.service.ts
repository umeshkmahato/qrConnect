import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { PolicyService } from '../authorization/policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConsentDto, UpdateSharingPreferencesDto } from './dto';

/**
 * Owner-controlled privacy: sharing preferences, consent records, and
 * personal-data workflows (export, account deletion).
 * Preferences take effect server-side immediately — no QR re-issue needed.
 */
@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly audit: AuditService,
  ) {}

  async getPreferences(user: AuthUser, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { sharing: true },
    });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return v.sharing;
  }

  async updatePreferences(user: AuthUser, dto: UpdateSharingPreferencesDto) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, dto.vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    const { vehicleId, ...fields } = dto;
    const prefs = await this.prisma.vehicleSharingPreference.upsert({
      where: { vehicleId },
      create: { vehicleId, ...fields, updatedById: user.id },
      update: { ...fields, updatedById: user.id },
    });
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: 'privacy.preferences.update', resourceType: 'vehicle', resourceId: vehicleId,
      metadata: fields as Record<string, unknown>,
    });
    return prefs;
  }

  async recordConsent(user: AuthUser, dto: ConsentDto) {
    return this.prisma.consentRecord.create({
      data: {
        userId: user.id,
        type: dto.type,
        granted: dto.granted,
        version: dto.version,
        withdrawnAt: dto.granted ? null : new Date(),
      },
    });
  }

  async myConsents(user: AuthUser) {
    return this.prisma.consentRecord.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /** Personal-data export (DPDP access right) — returns the caller's own data only. */
  async exportMyData(user: AuthUser) {
    const [profile, memberships, vehicles, contactRequests, consents] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { id: user.id } }),
      this.prisma.organizationMembership.findMany({ where: { userId: user.id }, include: { org: { select: { name: true } } } }),
      this.prisma.vehicleMembership.findMany({ where: { userId: user.id }, include: { vehicle: true } }),
      this.prisma.contactRequest.findMany({ where: { requesterId: user.id } }),
      this.prisma.consentRecord.findMany({ where: { userId: user.id } }),
    ]);
    await this.audit.record({ actorId: user.id, action: 'privacy.data_export', resourceType: 'user', resourceId: user.id });
    return { profile, memberships, vehicles, contactRequests, consents };
  }

  /** Account deletion: anonymize the user, revoke sessions, keep audit trail. */
  async deleteAccount(user: AuthUser) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          fullName: null,
          email: null,
          phone: `deleted:${user.id}`, // frees the real number; keeps uniqueness
        },
      }),
      this.prisma.userSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.vehicleMembership.updateMany({ where: { userId: user.id }, data: { status: 'REMOVED' } }),
      this.prisma.organizationMembership.updateMany({ where: { userId: user.id }, data: { status: 'REMOVED' } }),
      this.prisma.userDevice.deleteMany({ where: { userId: user.id } }),
    ]);
    await this.audit.record({ actorId: user.id, action: 'privacy.account_delete', resourceType: 'user', resourceId: user.id });
    return { deleted: true };
  }
}
