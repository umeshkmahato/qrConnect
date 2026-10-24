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
exports.PolicyService = exports.ORG_MANAGE_ROLES = exports.STAFF_ROLES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
exports.STAFF_ROLES = [
    client_1.OrgRole.ORGANIZATION_OWNER,
    client_1.OrgRole.ORGANIZATION_ADMIN,
    client_1.OrgRole.SECURITY_GUARD,
];
exports.ORG_MANAGE_ROLES = [client_1.OrgRole.ORGANIZATION_OWNER, client_1.OrgRole.ORGANIZATION_ADMIN];
let PolicyService = class PolicyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    isPlatformAdmin(user) {
        return user?.platformRole === client_1.PlatformRole.PLATFORM_SUPER_ADMIN;
    }
    async membership(userId, orgId) {
        const m = await this.prisma.organizationMembership.findUnique({
            where: { orgId_userId: { orgId, userId } },
        });
        return m && m.status === client_1.MembershipStatus.APPROVED ? m : null;
    }
    async membershipsOf(userId) {
        return this.prisma.organizationMembership.findMany({
            where: { userId },
            include: { org: { select: { id: true, name: true, type: true, status: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approvedOrgIds(userId) {
        const rows = await this.prisma.organizationMembership.findMany({
            where: { userId, status: client_1.MembershipStatus.APPROVED },
            select: { orgId: true },
        });
        return rows.map((r) => r.orgId);
    }
    async hasOrgRole(user, orgId, roles) {
        if (this.isPlatformAdmin(user))
            return true;
        const m = await this.membership(user.id, orgId);
        return !!m && roles.includes(m.role);
    }
    async isOrgManager(user, orgId) {
        return this.hasOrgRole(user, orgId, exports.ORG_MANAGE_ROLES);
    }
    async isStaff(user, orgId) {
        return this.hasOrgRole(user, orgId, exports.STAFF_ROLES);
    }
    async orgIsActive(orgId) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { status: true },
        });
        return org?.status === client_1.OrgStatus.APPROVED;
    }
    async isVehicleAssociate(userId, vehicleId) {
        const vm = await this.prisma.vehicleMembership.findUnique({
            where: { vehicleId_userId: { vehicleId, userId } },
        });
        return !!vm && vm.status === 'APPROVED';
    }
    async canManageVehicle(user, vehicleId, orgId) {
        if (this.isPlatformAdmin(user))
            return true;
        if (await this.isOrgManager(user, orgId))
            return true;
        const vm = await this.prisma.vehicleMembership.findUnique({
            where: { vehicleId_userId: { vehicleId, userId: user.id } },
        });
        return !!vm && vm.status === 'APPROVED' && vm.associationType === 'OWNER';
    }
};
exports.PolicyService = PolicyService;
exports.PolicyService = PolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PolicyService);
//# sourceMappingURL=policy.service.js.map