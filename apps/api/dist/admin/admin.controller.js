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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../common/decorators");
const pagination_1 = require("../common/pagination");
const admin_service_1 = require("./admin.service");
class DecideOrgDto {
    notes;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideOrgDto.prototype, "notes", void 0);
class DecideAbuseDto {
    status;
    notes;
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AbuseReportStatus),
    __metadata("design:type", String)
], DecideAbuseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideAbuseDto.prototype, "notes", void 0);
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    pendingOrgs(q) {
        return this.admin.listOrgs(q, client_1.OrgStatus.PENDING_VERIFICATION);
    }
    orgs(q, status) {
        return this.admin.listOrgs(q, status);
    }
    approveOrg(u, id) {
        return this.admin.decideOrg(u, id, client_1.OrgStatus.APPROVED);
    }
    rejectOrg(u, id, dto) {
        return this.admin.decideOrg(u, id, client_1.OrgStatus.REJECTED, dto.notes);
    }
    requestInfo(u, id, dto) {
        return this.admin.decideOrg(u, id, client_1.OrgStatus.INFO_REQUESTED, dto.notes);
    }
    suspendOrg(u, id, dto) {
        return this.admin.decideOrg(u, id, client_1.OrgStatus.SUSPENDED, dto.notes);
    }
    reinstateOrg(u, id) {
        return this.admin.decideOrg(u, id, client_1.OrgStatus.APPROVED);
    }
    auditLogs(q, orgId) {
        return this.admin.auditLogs(q, orgId);
    }
    abuseReports(q, status) {
        return this.admin.listAbuseReports(q, status);
    }
    decideAbuse(u, id, dto) {
        return this.admin.decideAbuse(u, id, dto);
    }
    suspendUser(u, id) {
        return this.admin.suspendUser(u, id);
    }
    reinstateUser(u, id) {
        return this.admin.reinstateUser(u, id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('organizations/pending'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "pendingOrgs", null);
__decorate([
    (0, common_1.Get)('organizations'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationQuery, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "orgs", null);
__decorate([
    (0, common_1.Post)('organizations/:id/approve'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approveOrg", null);
__decorate([
    (0, common_1.Post)('organizations/:id/reject'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DecideOrgDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectOrg", null);
__decorate([
    (0, common_1.Post)('organizations/:id/request-info'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DecideOrgDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "requestInfo", null);
__decorate([
    (0, common_1.Post)('organizations/:id/suspend'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DecideOrgDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "suspendOrg", null);
__decorate([
    (0, common_1.Post)('organizations/:id/reinstate'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reinstateOrg", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationQuery, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "auditLogs", null);
__decorate([
    (0, common_1.Get)('abuse-reports'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_1.PaginationQuery, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "abuseReports", null);
__decorate([
    (0, common_1.Post)('abuse-reports/:id/decide'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, DecideAbuseDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "decideAbuse", null);
__decorate([
    (0, common_1.Post)('users/:id/suspend'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Post)('users/:id/reinstate'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reinstateUser", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('api/v1/admin'),
    (0, decorators_1.PlatformAdmin)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map