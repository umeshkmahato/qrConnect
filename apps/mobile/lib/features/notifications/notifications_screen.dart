import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';

final notificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).dio.get('/api/v1/notifications');
  return res.data as List<dynamic>;
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: items.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (list) => list.isEmpty
            ? const Center(child: Text('No notifications yet'))
            : ListView.builder(
                itemCount: list.length,
                itemBuilder: (_, i) {
                  final n = list[i] as Map<String, dynamic>;
                  return ListTile(
                    leading: const Icon(Icons.notifications_outlined),
                    title: Text(n['title'] as String),
                    subtitle: Text(n['body'] as String),
                  );
                },
              ),
      ),
    );
  }
}
