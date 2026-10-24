import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  VehicleAssociationStatus,
  VehicleAssociationType,
  VehicleStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { PolicyService } from '../authorization/policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateQrToken, normalizePhone, normalizeRegNumber, sha256 } from '../common/utils/crypto.util';
import { PaginationQuery, paginated } from '../common/pagination';
import { AddVehicleMemberDto, CreateVehicleDto, UpdateVehicleDto } from './dto';

/**
 * Vehicle lifecycle. One ACTIVE vehicle per (org, normalized registrationNumber)
 * is enforced by a partial unique index (see migration). Historical/deactivated
 * records are preserved — a reg number may have multiple rows over time.
 */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, dto: CreateVehicleDto) {
    // Caller must be an approved member of the org (any role).
    const member = await this.policy.membership(user.id, dto.orgId);
    if (!member && !this.policy.isPlatformAdmin(user)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Not a member of this organization' });
    }
    if (!(await this.policy.orgIsActive(dto.orgId))) {
      throw new BadRequestException({ code: 'ORG_NOT_ACTIVE', message: 'Organization is not active' });
    }

    const reg = normalizeRegNumber(dto.registrationNumber);
    const idempKey = dto.idempotencyKey ? `vehicle:${user.id}:${dto.idempotencyKey}` : undefined;
    if (idempKey) {
      const existing = await this.prisma.auditLog.findFirst({
        where: { action: 'vehicle.create', 'metadata.idempotencyKey': { equals: idempKey } } as never,
      });
      if (existing?.resourceId) {
        return this.prisma.vehicle.findUnique({ where: { id: existing.resourceId } });
      }
    }

    const active = await this.prisma.vehicle.findFirst({
      where: { orgId: dto.orgId, registrationNumber: reg, status: { in: [VehicleStatus.ACTIVE, VehicleStatus.PENDING_APPROVAL] } },
    });
    if (active) {
      throw new ConflictException({ code: 'VEHICLE_EXISTS', message: 'Vehicle already registered in this organization' });
    }

    const qrToken = generateQrToken();
    const vehicle = await this.prisma.vehicle.create({
      data: {
        orgId: dto.orgId,
        registrationNumber: reg,
        vehicleType: dto.vehicleType,
        make: dto.make, model: dto.model, color: dto.color,
        status: VehicleStatus.PENDING_APPROVAL,
        createdById: user.id,
        memberships: {
          create: { userId: user.id, associationType: VehicleAssociationType.OWNER },
        },
        sharing: { create: {} },
        qrTokens: { create: { tokenHash: sha256(qrToken) } },
      },
    });
    await this.audit.record({
      actorId: user.id, orgId: dto.orgId,
      action: 'vehicle.create', resourceType: 'vehicle', resourceId: vehicle.id,
      metadata: idempKey ? { idempotencyKey: idempKey } : undefined,
    });
    // The plaintext QR token is returned once at issuance — only its hash persists.
    return { ...vehicle, qrToken };
  }

  async listMine(user: AuthUser, q: PaginationQuery) {
    const where = {
      memberships: { some: { userId: user.id, status: VehicleAssociationStatus.APPROVED } },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        include: { org: { select: { id: true, name: true } }, sharing: true },
        orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  async listForOrg(user: AuthUser, orgId: string, q: PaginationQuery) {
    const where = {
      orgId,
      registrationNumber: q.search ? { contains: q.search.toUpperCase().replace(/[^A-Z0-9]/g, '') } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        include: {
          memberships: {
            where: { associationType: VehicleAssociationType.OWNER, status: VehicleAssociationStatus.APPROVED },
            include: { user: { select: { id: true, fullName: true, phone: true } } },
          },
        },
        orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    void user;
    return paginated(items, total, q);
  }

  private async loadAndAuthorize(user: AuthUser, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { memberships: true, sharing: true },
    });
    if (!vehicle) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    const canView =
      (await this.policy.canManageVehicle(user, vehicleId, vehicle.orgId)) ||
      (await this.policy.isVehicleAssociate(user.id, vehicleId));
    if (!canView) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return vehicle;
  }

  async get(user: AuthUser, vehicleId: string) {
    return this.loadAndAuthorize(user, vehicleId);
  }

  async update(user: AuthUser, vehicleId: string, dto: UpdateVehicleDto) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { make: dto.make, model: dto.model, color: dto.color },
    });
  }

  async setStatus(user: AuthUser, vehicleId: string, status: VehicleStatus) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    const isOrgDecision = status === VehicleStatus.ACTIVE || status === VehicleStatus.REJECTED;
    const allowed = isOrgDecision
      ? await this.policy.isOrgManager(user, v.orgId)
      : await this.policy.canManageVehicle(user, vehicleId, v.orgId);
    if (!allowed) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status, deactivatedAt: status === VehicleStatus.DEACTIVATED ? new Date() : v.deactivatedAt },
    });
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: `vehicle.${status.toLowerCase()}`, resourceType: 'vehicle', resourceId: vehicleId,
    });
    return updated;
  }

  async addMember(user: AuthUser, vehicleId: string, dto: AddVehicleMemberDto) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
    if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    const target = await this.prisma.user.findUnique({ where: { phone: normalizePhone(dto.phone) } });
    if (!target) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'No account for that phone number' });
    const orgMember = await this.policy.membership(target.id, v.orgId);
    if (!orgMember) {
      throw new BadRequestException({ code: 'NOT_ORG_MEMBER', message: 'User is not a member of the organization' });
    }
    const vm = await this.prisma.vehicleMembership.upsert({
      where: { vehicleId_userId: { vehicleId, userId: target.id } },
      create: { vehicleId, userId: target.id, associationType: dto.associationType, status: VehicleAssociationStatus.PENDING },
      update: { associationType: dto.associationType, status: VehicleAssociationStatus.PENDING },
    });
    await this.audit.record({
      actorId: user.id, orgId: v.orgId,
      action: 'vehicle.member.add', resourceType: 'vehicle', resourceId: vehicleId,
      metadata: { targetUserId: target.id, associationType: dto.associationType },
    });
    return vm;
  }

  async decideVehicleMember(user: AuthUser, vehicleId: string, membershipId: string, approve: boolean) {
    const vm = await this.prisma.vehicleMembership.findUnique({ where: { id: membershipId } });
    if (!vm || vm.vehicleId !== vehicleId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Association not found' });
    }
    // The associated user accepts, or a vehicle owner/org manager decides.
    const isTarget = vm.userId === user.id;
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const canManage = v ? await this.policy.canManageVehicle(user, vehicleId, v.orgId) : false;
    if (!isTarget && !canManage) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    return this.prisma.vehicleMembership.update({
      where: { id: membershipId },
      data: { status: approve ? VehicleAssociationStatus.APPROVED : VehicleAssociationStatus.REMOVED },
    });
  }
}
