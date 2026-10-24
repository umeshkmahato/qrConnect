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
exports.AbuseReportsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_1 = require("../common/pagination");
let AbuseReportsService = class AbuseReportsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(user, dto) {
        const report = await this.prisma.abuseReport.create({
            data: { reporterId: user.id, ...dto },
        });
        await this.audit.record({
            actorId: user.id, orgId: dto.orgId,
            action: 'abuse_report.create', resourceType: 'abuse_report', resourceId: report.id,
            metadata: { reason: dto.reason },
        });
        return report;
    }
    async myReports(user, q) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.abuseReport.findMany({
                where: { reporterId: user.id },
                orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
            }),
            this.prisma.abuseReport.count({ where: { reporterId: user.id } }),
        ]);
        return (0, pagination_1.paginated)(items, total, q);
    }
    async adminList(q, status) {
        const where = { status };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.abuseReport.findMany({
                where, orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
            }),
            this.prisma.abuseReport.count({ where }),
        ]);
        return (0, pagination_1.paginated)(items, total, q);
    }
    async adminDecide(user, id, status, notes) {
        const updated = await this.prisma.abuseReport.update({
            where: { id },
            data: { status, resolvedById: user.id, resolvedAt: new Date(), resolutionNotes: notes },
        });
        await this.audit.record({
            actorId: user.id,
            action: `abuse_report.${status.toLowerCase()}`,
            resourceType: 'abuse_report', resourceId: id,
        });
        return updated;
    }
};
exports.AbuseReportsService = AbuseReportsService;
exports.AbuseReportsService = AbuseReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AbuseReportsService);
//# sourceMappingURL=abuse-reports.service.js.map