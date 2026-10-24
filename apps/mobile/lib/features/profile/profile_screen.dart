import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';

final profileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).dio.get('/api/v1/users/me');
  return res.data as Map<String, dynamic>;
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final session = ref.read(sessionStoreProvider);
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/auth/logout',
          data: {'refreshToken': session.refreshToken});
    } catch (_) {/* best-effort */}
    await session.clear();
    if (context.mounted) context.go('/auth/login');
  }

  Future<void> _deleteAccount(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Delete account?'),
        content: const Text('Your personal data will be erased and all sessions ended. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(c).colorScheme.error),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/privacy/account/delete');
      await ref.read(sessionStoreProvider).clear();
      if (context.mounted) context.go('/auth/login');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: profile.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (p) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ListTile(title: Text(p['fullName'] ?? '—'), subtitle: Text(p['phone'] as String)),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.download),
              title: const Text('Download my data'),
              onTap: () async {
                final res = await ref.read(apiClientProvider).dio.get('/api/v1/privacy/data-export');
                if (context.mounted) {
                  showDialog(context: context, builder: (c) => AlertDialog(
                    title: const Text('Your data export'),
                    content: SingleChildScrollView(child: Text(res.data.toString())),
                  ));
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.flag_outlined),
              title: const Text('Report a problem'),
              onTap: () => context.push('/report'),
            ),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: () => _logout(context, ref), child: const Text('Sign out')),
            TextButton(
              onPressed: () => _deleteAccount(context, ref),
              child: Text('Delete account', style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          ],
        ),
      ),
    );
  }
}
