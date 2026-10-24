# Role–permission matrix

Roles are org-scoped (except PLATFORM_SUPER_ADMIN). Org must be APPROVED for member-facing actions.

| Capability | PLATFORM_SUPER_ADMIN | ORGANIZATION_OWNER | ORGANIZATION_ADMIN | SECURITY_GUARD | VEHICLE_OWNER | REGISTERED_USER |
|---|---|---|---|---|---|---|
| Register organization | ✓ | — | — | — | — | ✓ (any user) |
| Review/approve org | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Suspend/reinstate org | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View org profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve/reject members | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create invitations | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Upload org documents | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Download org documents | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Register vehicle (member) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve/reject vehicle | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit/deactivate own vehicle | ✓ | ✓ (org) | ✓ (org) | ✗ | ✓ (owner assoc.) | ✗ |
| List org vehicles | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| QR resolve — staff detail | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| QR resolve — public detail | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rotate/revoke QR | ✓ | ✓ (org) | ✓ (org) | ✗ | ✓ (owner assoc.) | ✗ |
| Manage sharing preferences | ✓ | ✓ (org) | ✓ (org) | ✗ | ✓ (owner assoc.) | ✗ |
| Create contact request | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Respond to contact request | ✓ | ✗* | ✗* | ✗ | ✓ (vehicle owner) | requester: close own |
| File abuse report | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Triage abuse reports | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Suspend user | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View audit logs | ✓ (all) | own org (planned) | own org (planned) | ✗ | ✗ | ✗ |
| Export own data / delete account | self | self | self | self | self | self |

\* org admins can view contact requests for org vehicles via `loadForOwner` org-manager path but the respond action requires vehicle-owner association unless platform admin.

## Notes

- Guards in Org A have **zero** privileges in Org B — membership is resolved per `(orgId, userId)`.
- `SECURITY_GUARD` cannot approve memberships, vehicles, or manage invitations/documents.
- `VEHICLE_OWNER` role means "resident member who may register vehicles", distinct from `vehicle_memberships.associationType = OWNER` (per-vehicle ownership).
- Public scan visibility is additionally gated by the vehicle's sharing preferences (`allowPublicScan`, per-field toggles).
- QR possession is never proof of ownership — authorization comes from the authenticated principal + policy.
