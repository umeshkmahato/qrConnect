# External provider setup (requires credentials)

All integrations sit behind adapter boundaries; the app runs fully without them
using dev adapters. Fill these in to go production.

## SMS / OTP — REQUIRED for production login

- Providers: MSG91, Twilio Verify, or AWS SNS (India DLT registration required for domestic SMS ⚖).
- Implement `SmsProvider` in `notifications/` and swap it into `AuthService.requestOtp` where `devOtp` is currently the only output.
- Ensure `OTP_DEV_ECHO=false` (enforced automatically when `NODE_ENV=production`).

## Push (FCM + APNs)

- `firebase_core`/`firebase_messaging` are in pubspec; run `flutterfire configure` to generate `firebase_options.dart` (needs Firebase project).
- Server side: add FCM HTTP v1 sender to `NotificationsProcessor` using `user_devices.fcmToken`.

## Email

- SES (same region) recommended; adapter slot exists in notifications module.

## S3 malware scanning

- Options: ClamAV Lambda on S3 event, or a managed scanner. Flip `organization_documents.status` UPLOADED → UNDER_REVIEW → APPROVED/REJECTED via the scan result webhook.

## Secrets

Set these in AWS Secrets Manager (names provisioned by Terraform):
`jwt-access-secret`, `jwt-refresh-secret`, `otp-pepper`, `database-url`, plus any provider API keys.
