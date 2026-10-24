import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TooManyRequestsException } from '../common/exceptions';
import { ContactRequestStatus, VehicleAssociationStatus, VehicleAssociationType, VehicleStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { PolicyService } from '../authorization/policy.service';
import { RateLimiterService } from '../common/rate-limit/rate-limiter.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQuery, paginated } from '../common/pagination';
import { sha256 } from '../common/utils/crypto.util';
import { CreateContactRequestDto, RespondContactRequestDto } from './dto';
import { canTransition } from './state-machine';

@Injectable()
export class ContactRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly rateLimiter: RateLimiterService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a protected contact request. The requester never sees the owner's
   * phone/address — the owner decides whether to respond. Composite rate
   * limits: per requester, per requester+vehicle, per vehicle.
   */
  async create(user: AuthUser, dto: CreateContactRequestDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { sharing: true, org: true },
    });
    if (!vehicle || vehicle.status !== VehicleStatus.ACTIVE || vehicle.org.status !== 'APPROVED') {
      throw new NotFoundException({ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' });
    }
    if (!(vehicle.sharing?.allowContactRequests ?? true)) {
      throw new ForbiddenException({ code: 'CONTACT_DISABLED', message: 'The owner has disabled contact requests' });
    }

    if (dto.idempotencyKey) {
      const existing = await this.prisma.contactRequest.findUnique({
        where: { idempotencyKey: `${user.id}:${dto.idempotencyKey}` },
      });
      if (existing) return existing;
    }

    const [r1, r2, r3] = await Promise.all([
      this.rateLimiter.allowed(`cr:user:${user.id}`, 10, 3600),
      this.rateLimiter.allowed(`cr:user:${user.id}:veh:${vehicle.id}`, 3, 86400),
      this.rateLimiter.allowed(`cr:veh:${vehicle.id}`, 20, 86400),
    ]);
    if (!r1 || !r2 || !r3) {
      throw new TooManyRequestsException({ code: 'CONTACT_RATE_LIMITED', message: 'Too many contact requests' });
    }

    let qrTokenId: string | undefined;
    if (dto.qrToken) {
      const t = await this.prisma.vehicleQrToken.findUnique({ where: { tokenHash: sha256(dto.qrToken) } });
      qrTokenId = t?.vehicleId === vehicle.id ? t.id : undefined;
    }

    const request = await this.prisma.contactRequest.create({
      data: {
        vehicleId: vehicle.id,
        orgId: vehicle.orgId,
        qrTokenId,
        requesterId: user.id,
        category: dto.category,
        message: dto.message,
        idempotencyKey: dto.idempotencyKey ? `${user.id}:${dto.idempotencyKey}` : undefined,
      },
    });

    const owners = await this.prisma.vehicleMembership.findMany({
      where: { vehicleId: vehicle.id, associationType: VehicleAssociationType.OWNER, status: VehicleAssociationStatus.APPROVED },
      select: { userId: true },
    });
    for (const o of owners) {
      await this.notifications.enqueue({
        userId: o.userId,
        channel: 'IN_APP',
        type: 'CONTACT_REQUEST_RECEIVED',
        title: 'New contact request',
        body: `Someone wants to contact you about your vehicle (${vehicle.registrationNumber.slice(0, 4)}***).`,
        payload: { contactRequestId: request.id },
      });
    }
    await this.audit.record({
      actorId: user.id, orgId: vehicle.orgId,
      action: 'contact_request.create', resourceType: 'contact_request', resourceId: request.id,
    });
    return request;
  }

  /** Requests sent by or addressed to the caller (as vehicle owner). */
  async list(user: AuthUser, q: PaginationQuery, direction: 'sent' | 'received' = 'sent') {
    const where =
      direction === 'sent'
        ? { requesterId: user.id }
        : {
            vehicle: {
              memberships: {
                some: { userId: user.id, associationType: VehicleAssociationType.OWNER, status: VehicleAssociationStatus.APPROVED },
              },
            },
          };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactRequest.findMany({
        where,
        include: {
          vehicle: { select: { id: true, registrationNumber: true } },
          requester: { select: { id: true, fullName: true } }, // phone withheld
        },
        orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
      }),
      this.prisma.contactRequest.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  private async loadForOwner(user: AuthUser, id: string) {
    const req = await this.prisma.contactRequest.findUnique({
      where: { id },
      include: { vehicle: { include: { memberships: true } } },
    });
    if (!req) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Contact request not found' });
    const isOwner = req.vehicle.memberships.some(
      (m) => m.userId === user.id && m.associationType === VehicleAssociationType.OWNER && m.status === VehicleAssociationStatus.APPROVED,
    );
    const isRequester = req.requesterId === user.id;
    if (!isOwner && !isRequester && !this.policy.isPlatformAdmin(user) && !(await this.policy.isOrgManager(user, req.orgId))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    return { req, isOwner };
  }

  async get(user: AuthUser, id: string) {
    const { req } = await this.loadForOwner(user, id);
    return req;
  }

  /** Owner-side state transitions; requester may only close their own request. */
  async respond(user: AuthUser, id: string, dto: RespondContactRequestDto) {
    const { req, isOwner } = await this.loadForOwner(user, id);
    const isRequester = req.requesterId === user.id;
    const target = dto.action as ContactRequestStatus;

    // Authorization before state validation — never leak state to strangers.
    if (!isOwner && !(isRequester && target === ContactRequestStatus.CLOSED) && !this.policy.isPlatformAdmin(user)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only the vehicle owner can respond' });
    }
    if (!canTransition(req.status, target)) {
      throw new BadRequestException({
        code: 'INVALID_TRANSITION',
        message: `Cannot move request from ${req.status} to ${target}`,
      });
    }

    const updated = await this.prisma.contactRequest.update({
      where: { id },
      data: {
        status: target,
        respondedById: user.id,
        respondedAt: new Date(),
        responseMessage: dto.responseMessage,
      },
    });
    await this.notifications.enqueue({
      userId: req.requesterId,
      channel: 'IN_APP',
      type: 'CONTACT_REQUEST_UPDATED',
      title: 'Contact request updated',
      body: `Your contact request was ${target.toLowerCase()}.`,
      payload: { contactRequestId: req.id },
    });
    await this.audit.record({
      actorId: user.id, orgId: req.orgId,
      action: `contact_request.${target.toLowerCase()}`,
      resourceType: 'contact_request', resourceId: id,
    });
    return updated;
  }
}
