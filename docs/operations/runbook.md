# Operations runbook

## Environments

| Env | Infra | Notes |
|---|---|---|
| local | docker-compose (postgres, redis, minio, api, admin-web) | MinIO substitutes for S3; dev OTP echo on |
| staging | AWS `ap-south-1`, single-AZ RDS | Auto-deploys from `main` after CI |
| production | AWS `ap-south-1`, Multi-AZ RDS, `deletion_protection` | Manual approval gate |

## Deploy

1. CI green on the release commit.
2. `prisma migrate deploy` runs as part of the API container start (dev/compose) or as a dedicated ECS task step (staging/prod pipeline — see deploy workflow).
3. Push image to ECR → `aws ecs update-service --force-new-deployment`.
4. Smoke test: `GET /api/v1/health/ready` → 200; login flow via OTP; one QR resolve.

## Rollback

- App: redeploy previous task definition revision (`aws ecs update-service --task-definition <family>:<prev>`).
- DB: all migrations must be backward-compatible for at least one release (expand/contract pattern). If a destructive change is unavoidable, stage it across releases.
- If a bad migration already applied: restore from the pre-deploy snapshot (RDS snapshot taken by the deploy pipeline) into a new instance and repoint `DATABASE_URL` in Secrets Manager.

## Backup & restore

- RDS automated backups: 7d (staging) / 30d (production), encrypted with KMS.
- Quarterly restore drill: `aws rds restore-db-instance-from-db-snapshot` → temporary instance → run `prisma migrate status` + row counts → document in this file's drill log.
- S3 documents: versioning + 90d noncurrent expiry; restore via version id.

## Incident response

1. Detect (CloudWatch alarms: 5xx rate, DB CPU, queue failures) or report (abuse report / support).
2. Classify: availability vs security vs privacy.
3. Contain: suspend affected accounts/orgs (`admin` endpoints), revoke QR tokens or sessions as needed.
4. Eradicate/recover: patch, rotate secrets in Secrets Manager, redeploy.
5. Notify: DPDP breach-notification duties (see privacy plan — legal review required for thresholds).
6. Postmortem within 5 business days; update this runbook.

## Suspend a user or organization quickly

- User: `POST /api/v1/admin/users/{id}/suspend` (revokes all sessions immediately).
- Org: `POST /api/v1/admin/organizations/{id}/suspend` (blocks all member-facing ops; scans resolve as INACTIVE).

## Observability

- Structured logs → CloudWatch (`/ecs/<env>/api`), request id per request (`x-request-id`).
- Metrics: ALB 5xx, target health, DB CPU/storage, Redis evictions, BullMQ failed jobs.
- Never log: OTPs, tokens, QR secrets, phone numbers beyond masked form.
