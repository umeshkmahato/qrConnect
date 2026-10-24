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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const policy_service_1 = require("../authorization/policy.service");
const decorators_1 = require("../common/decorators");
const pagination_1 = require("../common/pagination");
const dto_1 = require("./dto");
const organizations_service_1 = require("./organizations.service");
let OrganizationsController = class OrganizationsController {
    orgs;
    constructor(orgs) {
        this.orgs = orgs;
    }
    create(user, dto) {
        return this.orgs.create(user, dto);
    }
    mine(user) {
        return this.orgs.myOrganizations(user);
    }
    join(user, dto) {
        return this.orgs.join(user, dto);
    }
    get(user, orgId) {
        return this.orgs.getById(user, orgId);
    }
    members(user, orgId, q) {
        return this.orgs.listMembers(user, orgId, q);
    }
    requestMembership(user, orgId) {
        return { orgId, message: 'Use /api/v1/organizations/join with an invite code' };
    }
    approve(user, orgId, id) {
        return this.orgs.decideMembership(user, orgId, id, 'APPROVED');
    }
    reject(user, orgId, id) {
        return this.orgs.decideMembership(user, orgId, id, 'REJECTED');
    }
    remove(user, orgId, id) {
        return this.orgs.decideMembership(user, orgId, id, 'REMOVED');
    }
    invite(user, orgId, dto) {
        return this.orgs.createInvitation(user, orgId, dto);
    }
    uploadUrl(user, orgId, dto) {
        return this.orgs.requestUploadUrl(user, orgId, dto);
    }
    confirmDoc(user, orgId, dto) {
        return this.orgs.confirmDocument(user, orgId, dto);
    }
    downloadUrl(user, id) {
        return this.orgs.documentDownloadUrl(user, id);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateOrganizationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "mine", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.JoinOrganizationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "join", null);
__decorate([
    (0, common_1.Get)(':orgId'),
    (0, decorators_1.Roles)(...Object.values(client_1.OrgRole)),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(':orgId/memberships'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pagination_1.PaginationQuery]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "members", null);
__decorate([
    (0, common_1.Post)(':orgId/memberships'),
    (0, decorators_1.Roles)(...Object.values(client_1.OrgRole)),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "requestMembership", null);
__decorate([
    (0, common_1.Post)(':orgId/memberships/:membershipId/approve'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Param)('membershipId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':orgId/memberships/:membershipId/reject'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Param)('membershipId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':orgId/memberships/:membershipId/remove'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Param)('membershipId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':orgId/invitations'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreateInvitationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(':orgId/documents/upload-url'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RequestUploadUrlDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "uploadUrl", null);
__decorate([
    (0, common_1.Post)(':orgId/documents/confirm'),
    (0, decorators_1.Roles)(...policy_service_1.ORG_MANAGE_ROLES),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orgId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ConfirmDocumentDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "confirmDoc", null);
__decorate([
    (0, common_1.Get)('documents/:documentId/download-url'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "downloadUrl", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)('organizations'),
    (0, common_1.Controller)('api/v1/organizations'),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map