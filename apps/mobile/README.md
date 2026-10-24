# NathConnect mobile

Flutter (Android + iOS), Material 3, English + Hindi localisation,
feature-first structure:

```
lib/
  main.dart                 bootstrap + DI + router
  core/
    api_client.dart         typed Dio client with token refresh + retry
    session.dart            secure token storage (Keychain / Keystore)
    router.dart             go_router config + auth redirects
    l10n/                   English + Hindi strings
  features/
    auth/                   phone + OTP screens
    home/                   dashboard with role-aware entries
    vehicles/               list / register / detail
    qr/                     QR display, share, rotate, revoke
    scan/                   camera scanner + permission states + result
    contact_requests/       inbox, detail, respond
    privacy/                sharing preferences + consent
    notifications/          in-app notification center
    profile/                account, devices, delete-account
    reports/                abuse reporting
```

## Run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000  # Android emulator
flutter test
```

`mobile_scanner` requires camera permission; flows handle granted/denied/
permanently-denied states explicitly. Push notifications need
`firebase_options.dart` generated via `flutterfire configure`
(credentials required — see docs/operations/provider-setup.md).

> NOTE: This app was authored without a local Flutter SDK; run
> `flutter analyze` / `flutter test` after installing Flutter >= 3.22.
