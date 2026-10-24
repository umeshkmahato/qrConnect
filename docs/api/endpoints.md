# API summary (v1)

Interactive OpenAPI is generated at `/api/docs` in non-production only.
Error envelope everywhere: `{ statusCode, code, message, requestId }`.

## Auth (public)
- `POST /api/v1/auth/otp/request` — rate-limited, resend cooldown; `devOtp` field only when `OTP_DEV_ECHO` (never prod)
- `POST /api/v1/auth/otp/verify` — uniform `INVALID_OTP` errors; attempt cap locks challenge
- `POST /api/v1/auth/session/refresh` — refresh-token rotation
- `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`

## Organizations
- `POST /api/v1/organizations` — register (creator becomes ORGANIZATION_OWNER)
- `GET /api/v1/organizations/me` — caller's memberships
- `POST /api/v1/organizations/join` — invite code / org code (staff roles never self-grantable)
- `GET /api/v1/organizations/{id}` — members only
- `GET/POST /api/v1/organizations/{id}/memberships[...]` — list/approve/reject/remove (org managers)
- `POST /api/v1/organizations/{id}/invitations` — single-purpose role codes
- `POST /api/v1/organizations/{id}/documents/upload-url` + `/confirm` — presigned S3 upload (type/size validated)
- `GET /api/v1/organizations/documents/{id}/download-url` — managers/platform admin only

## Vehicles
- `POST /api/v1/vehicles` — member of org; optional `idempotencyKey`; returns `qrToken` once
- `GET /api/v1/vehicles` — caller's associated vehicles
- `GET/PATCH /api/v1/vehicles/{id}` — associates or org managers only
- `POST /api/v1/vehicles/{id}/approve|reject` — org managers; `/deactivate` — owner/manager
- `POST /api/v1/vehicles/{id}/members` + accept/remove — authorized associations
- `GET /api/v1/organizations/{orgId}/vehicles` — staff listing + search

## QR
- `POST /api/v1/qr/resolve` — permission-aware projection; safe INVALID/REVOKED/INACTIVE outcomes
- `POST /api/v1/vehicles/{id}/qr/rotate|revoke` — owner association or org manager

## Contact
- `POST /api/v1/contact-requests` — composite rate limits + idempotency key
- `GET /api/v1/contact-requests[?direction=received]` — own sent/received only
- `POST /api/v1/contact-requests/{id}/respond` — owner-side state machine

## Privacy
- `GET/PATCH /api/v1/privacy/preferences?vehicleId=`
- `POST /api/v1/privacy/consents`, `GET /api/v1/privacy/consents`
- `GET /api/v1/privacy/data-export`, `POST /api/v1/privacy/account/delete`

## Notifications / reports
- `GET /api/v1/notifications` — in-app notification center
- `POST /api/v1/abuse-reports`, `GET /api/v1/abuse-reports/me`

## Admin (PLATFORM_SUPER_ADMIN)
- `GET /api/v1/admin/organizations[/pending]`, decisions: approve/reject/request-info/suspend/reinstate
- `GET /api/v1/admin/audit-logs`, `GET/POST /api/v1/admin/abuse-reports[...]`
- `POST /api/v1/admin/users/{id}/suspend|reinstate`

## Health
- `GET /api/v1/health/live`, `GET /api/v1/health/ready` (public)
