import { Injectable } from '@nestjs/common';
import { AbuseReportStatus, OrgStatus, UserStatus } from '@prisma/client';
import { AbuseReportsService } from '../abuse-reports/abuse-reports.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQuery, paginated } from '../common/pagination';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly abuse: AbuseReportsService,
  ) {}

  async listOrgs(q: PaginationQuery, status?: OrgStatus) {
    const where = {
      status,
      name: q.search ? { contains: q.search, mode: 'insensitive' as const } : undefined,
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
    return paginated(items, total, q);
  }

  async decideOrg(user: AuthUser, orgId: string, status: OrgStatus, notes?: string) {
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

  async auditLogs(q: PaginationQuery, orgId?: string) {
    const where = { orgId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: q.skip, take: q.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  listAbuseReports(q: PaginationQuery, status?: AbuseReportStatus) {
    return this.abuse.adminList(q, status);
  }

  decideAbuse(user: AuthUser, id: string, dto: { status: AbuseReportStatus; notes?: string }) {
    return this.abuse.adminDecide(user, id, dto.status, dto.notes);
  }

  suspendUser(user: AuthUser, targetUserId: string) {
    return this.auth.suspendUser(targetUserId, user.id);
  }

  async reinstateUser(user: AuthUser, targetUserId: string) {
    const u = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: UserStatus.ACTIVE, deletedAt: null },
    });
    await this.audit.record({
      actorId: user.id, action: 'admin.user.reinstate',
      resourceType: 'user', resourceId: targetUserId,
    });
    return u;
  }
}
