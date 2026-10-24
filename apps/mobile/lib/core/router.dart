import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_screen.dart';
import '../features/auth/otp_screen.dart';
import '../features/contact_requests/contact_requests_screen.dart';
import '../features/home/home_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/privacy/privacy_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/qr/qr_display_screen.dart';
import '../features/reports/report_screen.dart';
import '../features/scan/scan_result_screen.dart';
import '../features/scan/scanner_screen.dart';
import '../features/vehicles/register_vehicle_screen.dart';
import '../features/vehicles/vehicle_detail_screen.dart';
import '../features/vehicles/vehicles_screen.dart';
import 'session.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(sessionStoreProvider);
  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      final loggedIn = session.hasSession;
      final onAuth = state.matchedLocation.startsWith('/auth');
      if (!loggedIn && !onAuth) return '/auth/login';
      if (loggedIn && onAuth) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/auth/otp',
        builder: (_, state) => OtpScreen(phone: state.extra as String),
      ),
      GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/vehicles', builder: (_, __) => const VehiclesScreen()),
      GoRoute(path: '/vehicles/register', builder: (_, __) => const RegisterVehicleScreen()),
      GoRoute(
        path: '/vehicles/:id',
        builder: (_, state) => VehicleDetailScreen(vehicleId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/vehicles/:id/qr',
        builder: (_, state) => QrDisplayScreen(vehicleId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/scan', builder: (_, __) => const ScannerScreen()),
      GoRoute(
        path: '/scan/result',
        builder: (_, state) => ScanResultScreen(result: state.extra as Map<String, dynamic>),
      ),
      GoRoute(path: '/contact-requests', builder: (_, __) => const ContactRequestsScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(
        path: '/privacy',
        builder: (_, state) => PrivacyScreen(vehicleId: state.extra as String),
      ),
      GoRoute(
        path: '/report',
        builder: (_, state) => ReportScreen(context_: state.extra as Map<String, String?>?),
      ),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );
});
