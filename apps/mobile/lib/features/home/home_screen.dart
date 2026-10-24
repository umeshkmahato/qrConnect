import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

final membershipsProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).dio.get('/api/v1/organizations/me');
  return res.data as List<dynamic>;
});

/// Role-aware home: guards see scanner-first; owners see vehicles & requests.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  bool _isStaff(List<dynamic> memberships) => memberships.any((m) =>
      m['status'] == 'APPROVED' &&
      ['SECURITY_GUARD', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'].contains(m['role']));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memberships = ref.watch(membershipsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('NathConnect')),
      body: memberships.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (ms) {
          final staff = _isStaff(ms);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (staff)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.qr_code_scanner, size: 40),
                    title: const Text('Scan vehicle QR'),
                    subtitle: const Text('Verify a vehicle at the gate'),
                    onTap: () => context.push('/scan'),
                  ),
                ),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.directions_car, size: 40),
                  title: const Text('My vehicles'),
                  onTap: () => context.push('/vehicles'),
                ),
              ),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.contact_phone, size: 40),
                  title: const Text('Contact requests'),
                  onTap: () => context.push('/contact-requests'),
                ),
              ),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.notifications, size: 40),
                  title: const Text('Notifications'),
                  onTap: () => context.push('/notifications'),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.person),
                label: const Text('Profile & settings'),
                onPressed: () => context.push('/profile'),
              ),
            ],
          );
        },
      ),
    );
  }
}
