# Known limitations & next actions

## Implemented but not fully verified here

- Flutter app: complete source; **not compiled** — no Flutter SDK on this machine. Run `flutter analyze`/`flutter test` after installing Flutter ≥ 3.22.
- Admin-web: builds clean; manual UI walk-through not performed against the live stack.
- Document upload/download URLs: implemented (presigned, validated); end-to-end upload not exercised — MinIO image could not be pulled through the corporate registry mirror on this machine.
- Notification delivery: dev adapter verified in-process; BullMQ worker runs in the same process — production adapters (SMS/FCM/email) are integration boundaries, not yet implemented.

## Prepared, awaiting external configuration

- AWS infrastructure (Terraform): complete config for VPC/RDS/Redis/ECS/ALB/S3/KMS/Secrets/CloudWatch — `terraform validate` pending AWS creds; nothing provisioned, no charges incurred.
- Domain + ACM cert: wired when `domain_name` is set.
- CI workflows: written for GitHub Actions; not executed here.

## Intentionally out of scope (MVP)

- Payments/subscriptions (foundations only).
- In-app messaging between requester and owner (respond action only).
- Row-level security in Postgres (application-level isolation implemented; RLS noted as optional hardening).
- iOS/Android release pipelines.

## Recommended next actions

1. `flutter pub get && flutter analyze && flutter test` on a machine with the SDK.
2. Pull `minio/minio` + `redis:7-alpine` images on an unrestricted network, then `docker compose up --build` for the full stack.
3. Choose SMS provider (India DLT), implement `SmsProvider`.
4. `terraform init/plan` in a sandbox AWS account.
5. Add Playwright e2e for admin-web; expand Flutter widget tests.
6. Legal review of DPDP items flagged in docs/security/privacy-dpdp-plan.md.
