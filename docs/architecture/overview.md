# NathConnect architecture

## Shape

Modular monolith (NestJS) + Flutter mobile + Next.js admin + PostgreSQL + Redis + S3-compatible object storage.

```
Flutter app ─┐
Next.js web ─┼─ HTTPS ─> ALB ─> ECS Fargate (NestJS modular monolith)
                                ├─ PostgreSQL (RDS, private subnets)
                                ├─ Redis (ElastiCache) — rate limits, BullMQ queues
                                └─ S3 (private bucket, presigned URLs)
```

## Backend modules (apps/api/src)

| Module | Responsibility |
|---|---|
| auth | Phone OTP challenge lifecycle, access/refresh sessions, rotation, revocation |
| authorization | Central policy (`PolicyService`), `RolesGuard`, org-scoped roles |
| users | Profile, device registration |
| organizations | Registration, review lifecycle, documents, invitations, memberships |
| vehicles | Registration, associations, approval, org listing |
| qr | Token issuance (hashed), resolve with permission-aware projection, rotate/revoke |
| privacy | Sharing preferences, consent records, data export, account deletion |
| contact-requests | Protected contact state machine, idempotency, composite rate limits |
| notifications | BullMQ queue, IN_APP records, pluggable delivery adapters |
| abuse-reports | Filing + admin triage |
| admin | Platform-admin org review, user suspension, audit/abuse listing |
| audit | Append-only audit log for sensitive actions |
| health | Liveness + readiness (DB ping) |

## Key decisions

- **Opaque QR tokens**: 32 random bytes, base64url, sha256-hashed server-side. No PII in QR payload.
- **Org-scoped roles** via `organization_memberships`; a user can hold different roles in different orgs. `PLATFORM_SUPER_ADMIN` is a user-level flag, not an org role.
- **Deny by default**: global `AuthGuard` + `RolesGuard`; org context resolved server-side only.
- **One ACTIVE QR token per vehicle** — rotation revokes predecessors atomically.
- **One non-terminal vehicle per (org, regNumber)** — partial unique index; history preserved.
- **Migrations via Prisma Migrate**; raw SQL used only where Prisma can't express (partial index).
- **ECS Fargate** over EC2/EKS: least ops burden for a monolith; see ADR-001.

## Boundaries awaiting production credentials

- SMS/OTP delivery, FCM push, transactional email — adapter boundary exists (`DevDeliveryAdapter`); production adapters plug in at `notifications.processor`.
- Malware scanning of uploaded documents — presigned-upload boundary ready; wire an S3 event → scanner → document status update.
