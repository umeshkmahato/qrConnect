import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TooManyRequestsException } from '../common/exceptions';
import { QrTokenStatus, ScanOutcome, VehicleAssociationType, VehicleStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { PolicyService } from '../authorization/policy.service';
import { RateLimiterService } from '../common/rate-limit/rate-limiter.service';
import { generateQrToken, sha256 } from '../common/utils/crypto.util';
import { PrismaService } from '../prisma/prisma.service';

/**
 * QR lifecycle: opaque tokens only; sha256 hashes stored server-side.
 * Rotation revokes the previous token immediately (documented policy:
 * exactly one ACTIVE token per vehicle at any time).
 */
@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly rateLimiter: RateLimiterService,
    private readonly audit: AuditService,
  ) {}

  private async recordScan(input: {
    qrTokenId?: string; vehicleId?: string; orgId?: string;
    scannerUserId?: string; outcome: ScanOutcome;
  }) {
    await this.prisma.scanEvent.create({ data: input });
  }

  /**
   * Resolve a scanned QR token for an authenticated user.
   * Returns the minimum information the scanner's role + owner sharing
   * preferences permit. Errors never reveal whether a token "almost" existed.
   */
  async resolve(user: AuthUser, token: string) {
    // Format pre-check: tokens are 43-char base64url — anything else is malformed.
    if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
      return { outcome: 'INVALID', message: 'Invalid or unsupported QR code' };
    }

    const rl = await this.rateLimiter.allowed(`scan:${user.id}`, 60, 300);
    if (!rl) {
      await this.recordScan({ scannerUserId: user.id, outcome: ScanOutcome.RATE_LIMITED });
      throw new TooManyRequestsException({ code: 'SCAN_RATE_LIMITED', message: 'Too many scans' });
    }

    const qr = await this.prisma.vehicleQrToken.findUnique({
      where: { tokenHash: sha256(token) },
      include: {
        vehicle: {
          include: {
            sharing: true,
            org: { select: { id: true, name: true, status: true } },
            memberships: {
              where: { associationType: VehicleAssociationType.OWNER, status: 'APPROVED' },
              include: { user: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
    });

    const base = { qrTokenId: qr?.id, vehicleId: qr?.vehicleId, orgId: qr?.vehicle?.orgId, scannerUserId: user.id };

    if (!qr) {
      await this.recordScan({ ...base, outcome: ScanOutcome.TOKEN_INVALID });
      return { outcome: 'INVALID', message: 'Invalid or expired QR code' };
    }
    if (qr.status !== QrTokenStatus.ACTIVE) {
      await this.recordScan({ ...base, outcome: ScanOutcome.TOKEN_REVOKED });
      return { outcome: 'REVOKED', message: 'This QR code is no longer valid' };
    }
    const v = qr.vehicle;
    if (v.status !== VehicleStatus.ACTIVE || v.org.status !== 'APPROVED') {
      await this.recordScan({ ...base, outcome: ScanOutcome.VEHICLE_INACTIVE });
      return { outcome: 'INACTIVE', message: 'Vehicle is not currently verified' };
    }

    const sharing = v.sharing;
    const staff = await this.policy.isStaff(user, v.orgId);
    const member = staff || !!(await this.policy.membership(user.id, v.orgId));

    if (!staff && !member && !(sharing?.allowPublicScan ?? true)) {
      await this.recordScan({ ...base, outcome: ScanOutcome.DENIED_UNAUTHORIZED });
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Scanning is restricted for this vehicle' });
    }

    await this.recordScan({ ...base, outcome: ScanOutcome.SUCCESS });
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: 'qr.resolve', resourceType: 'vehicle', resourceId: v.id,
      metadata: { scannerRole: staff ? 'STAFF' : 'PUBLIC' },
    });

    // Permission-aware projection — never return owner phone or address.
    const owner = v.memberships[0]?.user;
    const result: Record<string, unknown> = {
      outcome: 'VERIFIED',
      vehicle: {
        id: v.id,
        verificationStatus: v.status,
        vehicleType: v.vehicleType,
      },
      scannerLevel: staff ? 'STAFF' : 'PUBLIC',
      contactRequestsEnabled: sharing?.allowContactRequests ?? true,
    };
    const veh = result.vehicle as Record<string, unknown>;
    if (staff || (sharing?.shareRegNumber ?? true)) veh.registrationNumber = v.registrationNumber;
    if (staff) {
      veh.make = v.make; veh.model = v.model; veh.color = v.color;
      if (sharing?.shareOwnerName && owner?.fullName) veh.ownerName = owner.fullName;
      if (sharing?.shareOrgName ?? true) veh.organizationName = v.org.name;
      if (sharing?.shareMembershipStatus ?? true) veh.organizationId = v.orgId;
    } else {
      if (sharing?.shareOwnerName && owner?.fullName) veh.ownerName = owner.fullName;
      if (sharing?.shareOrgName) veh.organizationName = v.org.name;
    }
    return result;
  }

  /** Rotate: issue a new token, revoke all prior active tokens (one ACTIVE at a time). */
  async rotate(user: AuthUser, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    const token = generateQrToken();
    await this.prisma.$transaction([
      this.prisma.vehicleQrToken.updateMany({
        where: { vehicleId, status: QrTokenStatus.ACTIVE },
        data: { status: QrTokenStatus.REVOKED, revokedAt: new Date(), revokedById: user.id, revokedReason: 'ROTATED' },
      }),
      this.prisma.vehicleQrToken.create({ data: { vehicleId, tokenHash: sha256(token) } }),
    ]);
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: 'qr.rotate', resourceType: 'vehicle', resourceId: vehicleId,
    });
    return { vehicleId, qrToken: token };
  }

  /** Revoke all active tokens. Vehicle can be re-issued via rotate. */
  async revoke(user: AuthUser, vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    await this.prisma.vehicleQrToken.updateMany({
      where: { vehicleId, status: QrTokenStatus.ACTIVE },
      data: { status: QrTokenStatus.REVOKED, revokedAt: new Date(), revokedById: user.id, revokedReason: 'REVOKED' },
    });
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: 'qr.revoke', resourceType: 'vehicle', resourceId: vehicleId,
    });
    return { vehicleId, revoked: true };
  }
}
