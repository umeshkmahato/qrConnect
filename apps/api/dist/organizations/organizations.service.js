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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
const env_1 = require("../config/env");
const policy_service_1 = require("../authorization/policy.service");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const crypto_util_1 = require("../common/utils/crypto.util");
const pagination_1 = require("../common/pagination");
const ALLOWED_CONTENT_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]);
let OrganizationsService = class OrganizationsService {
    prisma;
    policy;
    storage;
    audit;
    constructor(prisma, policy, storage, audit) {
        this.prisma = prisma;
        this.policy = policy;
        this.storage = storage;
        this.audit = audit;
    }
    async create(user, dto) {
        const org = await this.prisma.organization.create({
            data: {
                name: dto.name,
                type: dto.type,
                registrationNumber: dto.registrationNumber,
                addressLine1: dto.addressLine1,
                addressLine2: dto.addressLine2,
                city: dto.city,
                state: dto.state,
                pincode: dto.pincode,
                repName: dto.repName,
                repPhone: (0, crypto_util_1.normalizePhone)(dto.repPhone),
                repEmail: dto.repEmail,
                inviteCode: (0, crypto_util_1.generateInviteCode)(),
                createdById: user.id,
                memberships: {
                    create: {
                        userId: user.id,
                        role: client_1.OrgRole.ORGANIZATION_OWNER,
                        status: client_1.MembershipStatus.APPROVED,
                    },
                },
            },
        });
        await this.audit.record({
            actorId: user.id, orgId: org.id,
            action: 'organization.create', resourceType: 'organization', resourceId: org.id,
        });
        return org;
    }
    async myOrganizations(user) {
        return this.policy.membershipsOf(user.id);
    }
    async getById(user, orgId) {
        const isMember = await this.policy.membership(user.id, orgId);
        if (!this.policy.isPlatformAdmin(user) && !isMember) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            include: { documents: { select: { id: true, type: true, status: true, fileName: true, createdAt: true } } },
        });
        if (!org)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Organization not found' });
        return org;
    }
    async join(user, dto) {
        const invitation = await this.prisma.organizationInvitation.findUnique({
            where: { code: dto.code },
        });
        let orgId;
        let role;
        if (invitation && !invitation.revokedAt && (!invitation.expiresAt || invitation.expiresAt > new Date())) {
            if (invitation.usedCount >= invitation.maxUses) {
                throw new common_1.BadRequestException({ code: 'INVITE_EXHAUSTED', message: 'Invitation has reached its limit' });
            }
            orgId = invitation.orgId;
            role = invitation.role;
        }
        else {
            const org = await this.prisma.organization.findUnique({ where: { inviteCode: dto.code } });
            if (!org)
                throw new common_1.BadRequestException({ code: 'INVALID_INVITE', message: 'Invalid invitation code' });
            orgId = org.id;
            role = dto.requestedRole ?? client_1.OrgRole.VEHICLE_OWNER;
            if (role === client_1.OrgRole.ORGANIZATION_OWNER || role === client_1.OrgRole.ORGANIZATION_ADMIN) {
                role = client_1.OrgRole.VEHICLE_OWNER;
            }
        }
        const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org || org.status !== client_1.OrgStatus.APPROVED) {
            throw new common_1.BadRequestException({ code: 'ORG_NOT_ACTIVE', message: 'Organization is not accepting members' });
        }
        try {
            const membership = await this.prisma.$transaction(async (tx) => {
                const m = await tx.organizationMembership.create({
                    data: { orgId, userId: user.id, role, status: client_1.MembershipStatus.PENDING },
                });
                if (invitation) {
                    await tx.organizationInvitation.update({
                        where: { id: invitation.id },
                        data: { usedCount: { increment: 1 } },
                    });
                }
                return m;
            });
            await this.audit.record({
                actorId: user.id, orgId,
                action: 'membership.request', resourceType: 'membership', resourceId: membership.id,
                metadata: { role },
            });
            return membership;
        }
        catch {
            throw new common_1.ConflictException({ code: 'ALREADY_MEMBER', message: 'Membership already exists' });
        }
    }
    async listMembers(user, orgId, q) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.organizationMembership.findMany({
                where: { orgId },
                include: { user: { select: { id: true, phone: true, fullName: true, status: true } } },
                orderBy: { createdAt: 'desc' },
                skip: q.skip, take: q.take,
            }),
            this.prisma.organizationMembership.count({ where: { orgId } }),
        ]);
        void user;
        return (0, pagination_1.paginated)(items, total, q);
    }
    async decideMembership(user, orgId, membershipId, decision) {
        const m = await this.prisma.organizationMembership.findUnique({ where: { id: membershipId } });
        if (!m || m.orgId !== orgId) {
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Membership not found' });
        }
        if (m.role === client_1.OrgRole.ORGANIZATION_OWNER && decision !== 'APPROVED' && !this.policy.isPlatformAdmin(user)) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot remove organization owner' });
        }
        const updated = await this.prisma.organizationMembership.update({
            where: { id: membershipId },
            data: { status: decision, decidedById: user.id, decidedAt: new Date() },
        });
        await this.audit.record({
            actorId: user.id, orgId,
            action: `membership.${decision.toLowerCase()}`,
            resourceType: 'membership', resourceId: membershipId,
            metadata: { targetUserId: m.userId, role: m.role },
        });
        return updated;
    }
    async createInvitation(user, orgId, dto) {
        const inv = await this.prisma.organizationInvitation.create({
            data: {
                orgId,
                code: (0, crypto_util_1.generateInviteCode)(),
                role: dto.role,
                maxUses: dto.maxUses ?? 50,
                expiresAt: dto.expiresInDays ? new Date(Date.now() + dto.expiresInDays * 86400_000) : null,
                createdById: user.id,
            },
        });
        await this.audit.record({
            actorId: user.id, orgId,
            action: 'invitation.create', resourceType: 'invitation', resourceId: inv.id,
            metadata: { role: dto.role },
        });
        return inv;
    }
    async requestUploadUrl(user, orgId, dto) {
        if (!ALLOWED_CONTENT_TYPES.has(dto.contentType)) {
            throw new common_1.BadRequestException({ code: 'BAD_FILE_TYPE', message: 'Unsupported file type' });
        }
        if (dto.sizeBytes > env_1.env.documentUploadMaxBytes) {
            throw new common_1.BadRequestException({ code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' });
        }
        const s3Key = this.storage.newDocumentKey(orgId, dto.fileName);
        const doc = await this.prisma.organizationDocument.create({
            data: {
                orgId, type: dto.type, s3Key,
                fileName: dto.fileName, contentType: dto.contentType, sizeBytes: dto.sizeBytes,
                uploadedById: user.id,
            },
        });
        const uploadUrl = await this.storage.presignUpload(s3Key, dto.contentType);
        return { documentId: doc.id, s3Key, uploadUrl, expiresInSeconds: 300 };
    }
    async confirmDocument(user, orgId, dto) {
        const doc = await this.prisma.organizationDocument.findUnique({ where: { s3Key: dto.s3Key } });
        if (!doc || doc.orgId !== orgId) {
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Document not found' });
        }
        void user;
        return doc;
    }
    async documentDownloadUrl(user, documentId) {
        const doc = await this.prisma.organizationDocument.findUnique({ where: { id: documentId } });
        if (!doc)
            throw new common_1.NotFoundException({ code: 'NOT_FOUND', message: 'Document not found' });
        const allowed = this.policy.isPlatformAdmin(user) || (await this.policy.isOrgManager(user, doc.orgId));
        if (!allowed)
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        return { url: await this.storage.presignDownload(doc.s3Key), expiresInSeconds: 120 };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        policy_service_1.PolicyService,
        storage_service_1.StorageService,
        audit_service_1.AuditService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map