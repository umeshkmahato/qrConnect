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
exports.PrivacyService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const policy_service_1 = require("../authorization/policy.service");
const prisma_service_1 = require("../prisma/prisma.service");
let PrivacyService = class PrivacyService {
    prisma;
    policy;
    audit;
    constructor(prisma, policy, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.audit = audit;
    }
    async getPreferences(user, vehicleId) {
        const v = await this.prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { sharing: true },
        });
        if (!v)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
        if (!(await this.policy.canManageVehicle(user, vehicleId, v.orgId))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return v.sharing;
    }
    async updatePreferences(user, dto) {
        const v = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
        if (!v)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Vehicle not found' });
        if (!(await this.policy.canManageVehicle(user, dto.vehicleId, v.orgId))) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
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
            metadata: fields,
        });
        return prefs;
    }
    async recordConsent(user, dto) {
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
    async myConsents(user) {
        return this.prisma.consentRecord.findMany({
            where: { userId: user.id },
            orderBy: { recordedAt: 'desc' },
        });
    }
    async exportMyData(user) {
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
    async deleteAccount(user) {
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: user.id },
                data: {
                    status: 'DELETED',
                    deletedAt: new Date(),
                    fullName: null,
                    email: null,
                    phone: `deleted:${user.id}`,
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
};
exports.PrivacyService = PrivacyService;
exports.PrivacyService = PrivacyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        audit_service_1.AuditService])
], PrivacyService);
//# sourceMappingURL=privacy.service.js.map