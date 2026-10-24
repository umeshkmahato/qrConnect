import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string;
  orgId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Append-only audit trail for security-sensitive actions.
 * Metadata must never contain secrets, OTPs, tokens, or raw personal data.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(e: AuditEntry) {
    await this.prisma.auditLog.create({
      data: {
        actorId: e.actorId,
        orgId: e.orgId,
        action: e.action,
        resourceType: e.resourceType,
        resourceId: e.resourceId,
        metadata: e.metadata as object | undefined,
        ip: e.ip,
      },
    });
  }
}
