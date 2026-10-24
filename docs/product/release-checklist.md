# Release checklist

## Pre-merge

- [ ] CI green: api unit + e2e, admin-web build, terraform validate, secret scan
- [ ] Migrations reviewed for expand/contract safety
- [ ] No secrets/PII in diff (gitleaks clean)

## Pre-production

- [ ] `OTP_DEV_ECHO=false`, `NODE_ENV=production`
- [ ] Real SMS provider configured and DLT-registered (India)
- [ ] `firebase_options.dart` generated; FCM server key in Secrets Manager
- [ ] Domain + ACM cert validated; Route53/ALB DNS live
- [ ] RDS Multi-AZ + deletion protection + final-snapshot identifier set
- [ ] Secrets populated in Secrets Manager (never in env files/CI logs)
- [ ] Malware-scan pipeline wired to document uploads
- [ ] Backup restore drill executed and logged
- [ ] Privacy notice + ToS published; consent versions recorded
- [ ] Legal review items from docs/security/privacy-dpdp-plan.md resolved
- [ ] Load test results recorded vs service objectives

## Post-deploy

- [ ] Smoke: health/ready, OTP login, org approval, QR resolve, contact request
- [ ] Alarms firing to on-call channel
- [ ] Audit log spot-check for the deploy's own admin actions
