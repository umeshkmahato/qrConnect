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
exports.QrService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const policy_service_1 = require("../authorization/policy.service");
const rate_limiter_service_1 = require("../common/rate-limit/rate-limiter.service");
const crypto_util_1 = require("../common/utils/crypto.util");
const prisma_service_1 = require("../prisma/prisma.service");
let QrService = class QrService {
    prisma;
    policy;
    rateLimiter;
    audit;
    constructor(prisma, policy, rateLimiter, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.rateLimiter = rateLimiter;
        this.audit = audit;
    }
    async recordScan(input) {
        await this.prisma.scanEvent.create({ data: input });
    }
    async resolve(user, token) {
        if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
            return { outcome: 'INVALID', message: 'Invalid or unsupported QR code' };
        }
        const rl = await this.rateLimiter.allowed(`scan:${user.id}`, 60, 300);
        if (!rl) {
            await this.recordScan({ scannerUserId: user.id, outcome: client_1.ScanOutcome.RATE_LIMITED });
            throw new exceptions_1.TooManyRequestsException({ code: 'SCAN_RATE_LIMITED', message: 'Too many scans' });
        }
        const qr = await this.prisma.vehicleQrToken.findUnique({
            where: { tokenHash: (0, crypto_util_1.sha256)(token) },
            include: {
                vehicle: {
                    include: {
                        sharing: true,
                        org: { select: { id: true, name: true, status: true } },
                        memberships: {
                            where: { associationType: client_1.VehicleAssociationType.OWNER, status: 'APPROVED' },
                            include: { user: { select: { id: true, fullName: true } } },
                        },
                    },
                },
            },
        });
        const base = { qrTokenId: qr?.id, vehicleId: qr?.vehicleId, orgId: qr?.vehicle?.orgId, scannerUserId: user.id };
        if (!qr) {
            await this.recordScan({ ...base, outcome: client_1.ScanOutcome.TOKEN_INVALID });
            return { outcome: 'INVALID', message: 'Invalid or expired QR code' };
        }
        if (qr.status !== client_1.QrTokenStatus.ACTIVE) {
            await this.recordScan({ ...base, outcome: client_1.ScanOutcome.TOKEN_REVOKED });
            return { outcome: 'REVOKED', message: 'This QR code is no longer valid' };
        }
        const v = qr.vehicle;
        if (v.status !== client_1.VehicleStatus.ACTIVE || v.org.status !== 'APPROVED') {
            await this.recordScan({ ...base, outcome: client_1.ScanOutcome.VEHICLE_INACTIVE });
            return { outcome: 'INACTIVE', message: 'Vehicle is not currently verified' };
        }
        const sharing = v.sharing;
        const staff = await this.policy.isStaff(user, v.orgId);
        const member = staff || !!(await this.policy.membership(user.id, v.orgId));
        if (!staff && !member && !(sharing?.allowPublicScan ?? true)) {
            await this.recordScan({ ...base, outcome: client_1.ScanOutcome.DENIED_UNAUTHORIZED });
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Scanning is restricted for this vehicle' });
        }
        await this.recordScan({ ...base, outcome: client_1.ScanOutcome.SUCCESS });
        await this.audit.record({
            actorId: user.id, orgId: v.orgId,
            action: 'qr.resolve', resourceType: 'vehicle', resourceId: v.id,
            metadata: { scannerRole: staff ? 'STAFF' : 'PUBLIC' },
        });
        const owner = v.memberships[0]?.user;
        const result = {
            outcome: 'VERIFIED',
            vehicle: {
                id: v.id,
                verificationStatus: v.status,
                vehicleType: v.vehicleType,
            },
            scannerLevel: staff ? 'STAFF' : 'PUBLIC',
            contactRequestsEnabled: sharing?.allowContactRequests ?? true,
        };
        const veh = result.vehicle;
        if (staff || (sharing?.shareRegNumber ?? true))
            veh.registrationNumber = v.registrationNumber;
        if (staff) {
            veh.make = v.make;
            veh.model = v.model;
            veh.color = v.color;
            if (sharing?.shareOwnerName && owner?.fullName)
                veh.ownerName = owner.fullName;
            if (sharing?.shareOrgName ?? true)
                veh.organizationName = v.org.name;
            if (sharing?.shareMembershipStatus ?? true)
                veh.organizationId = v.orgId;
        }
        else {
            if (sharing?.shareOwnerName && owner?.fullName)
                veh.ownerName = owner.fullName;
            if (sharing?.shareOrgName)
                veh.organizationName = v.org.name;
        }
        return result;
    }
    async rotate(user, vehicleId) {
        const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!v)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
        if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const token = (0, crypto_util_1.generateQrToken)();
        await this.prisma.$transaction([
            this.prisma.vehicleQrToken.updateMany({
                where: { vehicleId, status: client_1.QrTokenStatus.ACTIVE },
                data: { status: client_1.QrTokenStatus.REVOKED, revokedAt: new Date(), revokedById: user.id, revokedReason: 'ROTATED' },
            }),
            this.prisma.vehicleQrToken.create({ data: { vehicleId, tokenHash: (0, crypto_util_1.sha256)(token) } }),
        ]);
        await this.audit.record({
            actorId: user.id, orgId: v.orgId,
            action: 'qr.rotate', resourceType: 'vehicle', resourceId: vehicleId,
        });
        return { vehicleId, qrToken: token };
    }
    async revoke(user, vehicleId) {
        const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!v)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
        if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        await this.prisma.vehicleQrToken.updateMany({
            where: { vehicleId, status: client_1.QrTokenStatus.ACTIVE },
            data: { status: client_1.QrTokenStatus.REVOKED, revokedAt: new Date(), revokedById: user.id, revokedReason: 'REVOKED' },
        });
        await this.audit.record({
            actorId: user.id, orgId: v.orgId,
            action: 'qr.revoke', resourceType: 'vehicle', resourceId: vehicleId,
        });
        return { vehicleId, revoked: true };
    }
};
exports.QrService = QrService;
exports.QrService = QrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        rate_limiter_service_1.RateLimiterService,
        audit_service_1.AuditService])
], QrService);
//# sourceMappingURL=qr.service.js.map