# Privacy & DPDP implementation plan (India DPDP Act 2023 + DPDP Rules 2025)

> This is an engineering implementation plan, not a legal determination.
> Items marked ⚖ require qualified legal review before launch.

## Data map

| Data | Purpose | Lawful basis (candidate) | Required? |
|---|---|---|---|
| Phone number | Account identity, OTP login | Contract necessity / consent | Yes |
| Name | Display for authorized staff (owner opt-in) | Consent (sharing toggle) | Optional |
| Org address/rep details | Org verification | Legitimate use / verification | Yes |
| Registration number | Vehicle identification | Consent + org membership | Yes |
| Verification documents | Org legitimacy review | Consent | Yes |
| Contact messages | Protected owner contact | Consent | Optional |
| Scan events | Security audit, abuse prevention | Legitimate interest | Yes |
| Audit logs | Accountability | Legal/legitimate | Yes |

## Implemented controls

- **Consent records** (`consent_records`) — type, version, grant/withdraw timestamps.
- **Purpose limitation / minimization** — QR holds no PII; API projections return minimum fields per role; sharing prefs are opt-in per field.
- **Access & correction** — `GET /privacy/data-export`; profile update endpoints.
- **Erasure** — `POST /privacy/account/delete`: anonymizes the user, revokes sessions, removes associations and devices. Audit rows retain the opaque id (documented).
- **Grievance channel** — abuse reports + admin triage workflow (grievance officer designation is ⚖).
- **Data residency** — AWS `ap-south-1` (Mumbai) for all stateful resources.
- **No GPS/location tracking** anywhere in the design.
- **Children** — platform is for adult residents/staff; age-verification need is ⚖.
- **Breach response** — see incident runbook; user-notification duty thresholds are ⚖ pending notified rules.

## Not yet implemented / legal-review queue

- Published privacy notice + ToS screens (copy needed; consent version strings wired already).
- Significant Data Fiduciary obligations if thresholds are crossed (⚖).
- Data retention legal-hold overrides for disputes (S3 object lock — available, not enabled by default).
- Cross-border transfer analysis for any analytics vendors (none currently).
- Malayalam/other-language privacy notices (English + Hindi app strings exist).
