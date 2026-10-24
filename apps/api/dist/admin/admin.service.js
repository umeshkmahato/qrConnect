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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const abuse_reports_service_1 = require("../abuse-reports/abuse-reports.service");
const audit_service_1 = require("../audit/audit.service");
const auth_service_1 = require("../auth/auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_1 = require("../common/pagination");
let AdminService = class AdminService {
    prisma;
    audit;
    auth;
    abuse;
    constructor(prisma, audit, auth, abuse) {
        this.prisma = prisma;
        this.audit = audit;
        this.auth = auth;
        this.abuse = abuse;
    }
    async listOrgs(q, status) {
        const where = {
            status,
            name: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.organization.findMany({
                where,
                include: {
                    documents: { select: { id: true, type: true, status: true, fileName: true } },
                    _count: { select: { memberships: true, vehicles: true } },
                },
                orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
            }),
            this.prisma.organization.count({ where }),
        ]);
        return (0, pagination_1.paginated)(items, total, q);
    }
    async decideOrg(user, orgId, status, notes) {
        const org = await this.prisma.organization.update({
            where: { id: orgId },
            data: { status, reviewedById: user.id, reviewedAt: new Date(), reviewNotes: notes },
        });
        await this.audit.record({
            actorId: user.id, orgId,
            action: `admin.organization.${status.toLowerCase()}`,
            resourceType: 'organization', resourceId: orgId,
            metadata: notes ? { notes } : undefined,
        });
        return org;
    }
    async auditLogs(q, orgId) {
        const where = { orgId };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where, orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return (0, pagination_1.paginated)(items, total, q);
    }
    listAbuseReports(q, status) {
        return this.abuse.adminList(q, status);
    }
    decideAbuse(user, id, dto) {
        return this.abuse.adminDecide(user, id, dto.status, dto.notes);
    }
    suspendUser(user, targetUserId) {
        return this.auth.suspendUser(targetUserId, user.id);
    }
    async reinstateUser(user, targetUserId) {
        const u = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { status: client_1.UserStatus.ACTIVE, deletedAt: null },
        });
        await this.audit.record({
            actorId: user.id, action: 'admin.user.reinstate',
            resourceType: 'user', resourceId: targetUserId,
        });
        return u;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        auth_service_1.AuthService,
        abuse_reports_service_1.AbuseReportsService])
], AdminService);
//# sourceMappingURL=admin.service.js.map