# Implementation & verification report

## Status by deliverable

### Implemented and verified (ran here)

- **NestJS API** — all modules compile (`tsc --noEmit` clean), `nest build` produces `dist/`, ESLint 0 problems.
- **PostgreSQL schema** — Prisma migrations `init` + `active_vehicle_partial_unique` applied to a live postgres:16 container; partial unique index verified with `\di`.
- **Seed** — `node prisma/seed.js` ran successfully; creates platform admin, approved + pending orgs, roles, vehicle + QR token, contact request, abuse report.
- **Unit tests** — 11/11 pass (crypto utils, state machine, policy service incl. cross-org denial).
- **E2E tests** — 14/14 pass against real Postgres + Redis: OTP login, uniform OTP errors, org registration, admin queue access, vehicle registration, cross-org 403, staff vs public QR projections, malformed/revoked tokens, rotation invalidation, contact request lifecycle incl. 403 for non-owner respond and INVALID_TRANSITION, sharing-preference enforcement (403 when disabled), abuse report visibility.
- **Live API smoke** — booted `dist/main.js` against real DB/Redis: `health/ready` OK; OTP request (dev echo) → verify → JWT → `qr/rotate` → `qr/resolve` returned the STAFF projection.
- **Admin-web** — `next build` completes; 5 routes (login, dashboard, platform review queue + abuse + audit, org member/vehicle/invitation management).
- **Rate limits** — OTP limit (429) and resend cooldown (429 OTP_RESEND_COOLDOWN) both observed live.

### Implemented but not fully verified

- **Flutter app** — full feature-first source (auth, home, vehicles, QR display/rotate/revoke, scanner, results, contact requests, notifications, privacy, profile, reports) + unit tests; **not compiled — no Flutter SDK on this machine.**
- **Docker Compose full stack** — compose file complete and services defined; `api`/`admin-web` image builds not executed here because the corporate registry mirror (`artifactoryedgedocker.service.csnzoo.com`) is unreachable from this machine and `node:20-alpine`, `redis:7-alpine`, `minio` images could not be pulled. Infra services were verified via locally cached images (`postgres:16-alpine`, `redis:7.0.0`).
- **MinIO/S3 document flow** — presigned upload/download implemented; not exercised end-to-end (no MinIO image).
- **OpenAPI** — generated at `/api/docs` in non-production.

### Prepared, awaiting external configuration

- Terraform AWS stack (VPC, RDS, Redis, ECS Fargate, ALB+ACM, S3+KMS, Secrets Manager, CloudWatch alarms) — `validate` not run (no AWS creds / terraform binary).
- CI workflows (GitHub Actions) — written; will run on first push.
- SMS/FCM/email providers — adapter boundary + documented setup (docs/operations/provider-setup.md).
- DPDP legal-review items — flagged in docs/security/privacy-dpdp-plan.md.

## Test results (actual)

| Suite | Result |
|---|---|
| api unit (jest) | 11/11 pass |
| api e2e (supertest + real PG/Redis) | 14/14 pass |
| api typecheck / lint / build | clean |
| admin-web `next build` | clean |
| mobile | not run (no SDK) |

## Environment notes

- Local port conflicts on this machine: another project's postgres occupies 5432 and a node process occupies 3000 — verification used 5433/3100 and `.env` was adjusted to 5433. Defaults in `.env.example` and compose are unchanged and correct for a clean machine.
- Nothing was staged or committed (`git add` intentionally not run per instruction).
