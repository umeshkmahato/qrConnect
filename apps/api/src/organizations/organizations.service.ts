import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  OrgRole,
  OrgStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { env } from '../config/env';
import { PolicyService } from '../authorization/policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { generateInviteCode, normalizePhone } from '../common/utils/crypto.util';
import { PaginationQuery, paginated } from '../common/pagination';
import {
  ConfirmDocumentDto,
  CreateInvitationDto,
  CreateOrganizationDto,
  JoinOrganizationDto,
  RequestUploadUrlDto,
} from './dto';

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PolicyService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Register an organization. The creator becomes ORGANIZATION_OWNER with an
   * APPROVED membership (org itself starts PENDING_VERIFICATION and cannot
   * perform member-facing operations until a platform admin approves it).
   */
  async create(user: AuthUser, dto: CreateOrganizationDto) {
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
        repPhone: normalizePhone(dto.repPhone),
        repEmail: dto.repEmail,
        inviteCode: generateInviteCode(),
        createdById: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: OrgRole.ORGANIZATION_OWNER,
            status: MembershipStatus.APPROVED,
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

  /** Organizations the caller is a member of (any status), with role. */
  async myOrganizations(user: AuthUser) {
    return this.policy.membershipsOf(user.id);
  }

  /** Org detail — members only (platform admin included). */
  async getById(user: AuthUser, orgId: string) {
    const isMember = await this.policy.membership(user.id, orgId);
    if (!this.policy.isPlatformAdmin(user) && !isMember) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { documents: { select: { id: true, type: true, status: true, fileName: true, createdAt: true } } },
    });
    if (!org) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Organization not found' });
    return org;
  }

  /** Join an org via its standing invite code or a single-purpose invitation code. */
  async join(user: AuthUser, dto: JoinOrganizationDto) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { code: dto.code },
    });
    let orgId: string;
    let role: OrgRole;

    if (invitation && !invitation.revokedAt && (!invitation.expiresAt || invitation.expiresAt > new Date())) {
      if (invitation.usedCount >= invitation.maxUses) {
        throw new BadRequestException({ code: 'INVITE_EXHAUSTED', message: 'Invitation has reached its limit' });
      }
      orgId = invitation.orgId;
      role = invitation.role;
    } else {
      const org = await this.prisma.organization.findUnique({ where: { inviteCode: dto.code } });
      if (!org) throw new BadRequestException({ code: 'INVALID_INVITE', message: 'Invalid invitation code' });
      orgId = org.id;
      role = dto.requestedRole ?? OrgRole.VEHICLE_OWNER;
      // Self-service joining never grants staff roles.
      if (role === OrgRole.ORGANIZATION_OWNER || role === OrgRole.ORGANIZATION_ADMIN) {
        role = OrgRole.VEHICLE_OWNER;
      }
    }

    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.status !== OrgStatus.APPROVED) {
      throw new BadRequestException({ code: 'ORG_NOT_ACTIVE', message: 'Organization is not accepting members' });
    }

    try {
      const membership = await this.prisma.$transaction(async (tx) => {
        const m = await tx.organizationMembership.create({
          data: { orgId, userId: user.id, role, status: MembershipStatus.PENDING },
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
    } catch {
      throw new ConflictException({ code: 'ALREADY_MEMBER', message: 'Membership already exists' });
    }
  }

  async listMembers(user: AuthUser, orgId: string, q: PaginationQuery) {
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
    return paginated(items, total, q);
  }

  async decideMembership(
    user: AuthUser,
    orgId: string,
    membershipId: string,
    decision: 'APPROVED' | 'REJECTED' | 'REMOVED',
  ) {
    const m = await this.prisma.organizationMembership.findUnique({ where: { id: membershipId } });
    if (!m || m.orgId !== orgId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Membership not found' });
    }
    if (m.role === OrgRole.ORGANIZATION_OWNER && decision !== 'APPROVED' && !this.policy.isPlatformAdmin(user)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot remove organization owner' });
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

  async createInvitation(user: AuthUser, orgId: string, dto: CreateInvitationDto) {
    const inv = await this.prisma.organizationInvitation.create({
      data: {
        orgId,
        code: generateInviteCode(),
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

  // ----- Document upload (private object storage, presigned URLs) -----

  async requestUploadUrl(user: AuthUser, orgId: string, dto: RequestUploadUrlDto) {
    if (!ALLOWED_CONTENT_TYPES.has(dto.contentType)) {
      throw new BadRequestException({ code: 'BAD_FILE_TYPE', message: 'Unsupported file type' });
    }
    if (dto.sizeBytes > env.documentUploadMaxBytes) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' });
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

  async confirmDocument(user: AuthUser, orgId: string, dto: ConfirmDocumentDto) {
    const doc = await this.prisma.organizationDocument.findUnique({ where: { s3Key: dto.s3Key } });
    if (!doc || doc.orgId !== orgId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    void user;
    return doc;
  }

  /** Short-lived download URL for a document — org manager or platform reviewer only. */
  async documentDownloadUrl(user: AuthUser, documentId: string) {
    const doc = await this.prisma.organizationDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Document not found' });
    const allowed = this.policy.isPlatformAdmin(user) || (await this.policy.isOrgManager(user, doc.orgId));
    if (!allowed) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
    return { url: await this.storage.presignDownload(doc.s3Key), expiresInSeconds: 120 };
  }
}
