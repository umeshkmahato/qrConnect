# QR threat model

## Assets

- Vehicle registration↔owner linkage
- Owner identity (name, phone, address) — never in QR, never returned to unauthorized parties
- QR token (bearer capability for *limited* info + contact-request initiation)
- Scan-event trail

## Design invariants

- QR encodes only `nathconnect:v1:<32-byte random>` — an opaque, unguessable token.
- Server stores sha256(token); plaintext exists in the QR image and the issuance response only.
- Resolution is authenticated and policy-gated: scanner role, org status, vehicle status, sharing preferences.
- All scans write a `scan_events` row (outcome included) — supports abuse investigation.
- One ACTIVE token per vehicle; rotation atomically revokes predecessors.

## Threats and mitigations

| Threat | Mitigation |
|---|---|
| Token guessing / enumeration | 256-bit token space; malformed tokens rejected pre-lookup; per-user scan rate limit (60/5min); all misses logged |
| QR cloning (photo/copy) | Possession grants only minimal disclosure per policy — never ownership or auth; owner can rotate/revoke instantly; scan audit trail exposes anomalous volumes |
| Replay after revocation | `status != ACTIVE` → REVOKED outcome; rotation invalidates immediately (documented policy) |
| Scraping / bulk scans | Composite rate limits (per user, per token, per vehicle); suspended accounts blocked at AuthGuard |
| Privacy leakage to public scanner | Field-level projection: phone/address never returned; per-field sharing toggles; `allowPublicScan` kill switch |
| Malformed/hostile payloads | Strict regex pre-check; DTO validation; parameterized ORM only |
| Token theft from logs | Tokens are never logged — only sha256 lookups; scan events store token *id*, not value |
| Insider access to hashes | Hashes are non-invertible for 256-bit inputs; DB compromise does not yield printable QRs |

## Residual risks (accepted / tracked)

- A live QR photo shared publicly still yields whatever the owner's sharing prefs expose to a registered user — mitigated by per-user rate limits + abuse reporting + revocation.
- Offline verification is not supported; every scan is a live policy evaluation (deliberate — stale allowlists leak).
