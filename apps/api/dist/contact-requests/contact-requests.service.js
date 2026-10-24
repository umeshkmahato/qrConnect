"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRequestsService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const policy_service_1 = require("../authorization/policy.service");
const rate_limiter_service_1 = require("../common/rate-limit/rate-limiter.service");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_1 = require("../common/pagination");
const crypto_util_1 = require("../common/utils/crypto.util");
const state_machine_1 = require("./state-machine");
let ContactRequestsService = class ContactRequestsService {
    prisma;
    policy;
    rateLimiter;
    notifications;
    audit;
    constructor(prisma, policy, rateLimiter, notifications, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.rateLimiter = rateLimiter;
        this.notifications = notifications;
        this.audit = audit;
    }
    async create(user, dto) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: dto.vehicleId },
            include: { sharing: true, org: true },
        });
        if (!vehicle || vehicle.status !== client_1.VehicleStatus.ACTIVE || vehicle.org.status !== 'APPROVED') {
            throw new common_1.NotFoundException({ code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' });
        }
        if (!(vehicle.sharing?.allowContactRequests ?? true)) {
            throw new common_1.ForbiddenException({ code: 'CONTACT_DISABLED', message: 'The owner has disabled contact requests' });
        }
        if (dto.idempotencyKey) {
            const existing = await this.prisma.contactRequest.findUnique({
                where: { idempotencyKey: `${user.id}:${dto.idempotencyKey}` },
            });
            if (existing)
                return existing;
        }
        const [r1, r2, r3] = await Promise.all([
            this.rateLimiter.allowed(`cr:user:${user.id}`, 10, 3600),
            this.rateLimiter.allowed(`cr:user:${user.id}:veh:${vehicle.id}`, 3, 86400),
            this.rateLimiter.allowed(`cr:veh:${vehicle.id}`, 20, 86400),
        ]);
        if (!r1 || !r2 || !r3) {
            throw new exceptions_1.TooManyRequestsException({ code: 'CONTACT_RATE_LIMITED', message: 'Too many contact requests' });
        }
        let qrTokenId;
        if (dto.qrToken) {
            const t = await this.prisma.vehicleQrToken.findUnique({ where: { tokenHash: (0, crypto_util_1.sha256)(dto.qrToken) } });
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
            where: { vehicleId: vehicle.id, associationType: client_1.VehicleAssociationType.OWNER, status: client_1.VehicleAssociationStatus.APPROVED },
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
    async list(user, q, direction = 'sent') {
        const where = direction === 'sent'
            ? { requesterId: user.id }
            : {
                vehicle: {
                    memberships: {
                        some: { userId: user.id, associationType: client_1.VehicleAssociationType.OWNER, status: client_1.VehicleAssociationStatus.APPROVED },
                    },
                },
            };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.contactRequest.findMany({
                where,
                include: {
                    vehicle: { select: { id: true, registrationNumber: true } },
                    requester: { select: { id: true, fullName: true } },
                },
                orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
            }),
            this.prisma.contactRequest.count({ where }),
        ]);
        return (0, pagination_1.paginated)(items, total, q);
    }
    async loadForOwner(user, id) {
        const req = await this.prisma.contactRequest.findUnique({
            where: { id },
            include: { vehicle: { include: { memberships: true } } },
        });
        if (!req)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Contact request not found' });
        const isOwner = req.vehicle.memberships.some((m) => m.userId === user.id && m.associationType === client_1.VehicleAssociationType.OWNER && m.status === client_1.VehicleAssociationStatus.APPROVED);
        const isRequester = req.requesterId === user.id;
        if (!isOwner && !isRequester && !this.policy.isPlatformAdmin(user) && !(await this.policy.isOrgManager(user, req.orgId))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return { req, isOwner };
    }
    async get(user, id) {
        const { req } = await this.loadForOwner(user, id);
        return req;
    }
    async respond(user, id, dto) {
        const { req, isOwner } = await this.loadForOwner(user, id);
        const isRequester = req.requesterId === user.id;
        const target = dto.action;
        if (!isOwner && !(isRequester && target === client_1.ContactRequestStatus.CLOSED) && !this.policy.isPlatformAdmin(user)) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Only the vehicle owner can respond' });
        }
        if (!(0, state_machine_1.canTransition)(req.status, target)) {
            throw new common_1.BadRequestException({
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
};
exports.ContactRequestsService = ContactRequestsService;
exports.ContactRequestsService = ContactRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        rate_limiter_service_1.RateLimiterService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], ContactRequestsService);
//# sourceMappingURL=contact-requests.service.js.map