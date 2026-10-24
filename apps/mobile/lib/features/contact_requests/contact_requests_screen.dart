import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';

final requestsProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, direction) async {
  final res = await ref.watch(apiClientProvider).dio
      .get('/api/v1/contact-requests', queryParameters: {'direction': direction});
  return res.data as Map<String, dynamic>;
});

class ContactRequestsScreen extends ConsumerStatefulWidget {
  const ContactRequestsScreen({super.key});
  @override
  ConsumerState<ContactRequestsScreen> createState() => _ContactRequestsScreenState();
}

class _ContactRequestsScreenState extends ConsumerState<ContactRequestsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab = TabController(length: 2, vsync: this);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact requests'),
        bottom: TabBar(controller: _tab, tabs: const [Tab(text: 'Received'), Tab(text: 'Sent')]),
      ),
      body: TabBarView(controller: _tab, children: [
        _RequestList(direction: 'received'),
        _RequestList(direction: 'sent'),
      ]),
    );
  }
}

class _RequestList extends ConsumerWidget {
  const _RequestList({required this.direction});
  final String direction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(requestsProvider(direction));
    return page.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text(apiErrorMessage(e))),
      data: (p) {
        final items = p['items'] as List<dynamic>;
        if (items.isEmpty) return const Center(child: Text('Nothing here yet'));
        return ListView.builder(
          itemCount: items.length,
          itemBuilder: (_, i) {
            final r = items[i] as Map<String, dynamic>;
            return ListTile(
              title: Text('${r['category']} — ${r['vehicle']?['registrationNumber'] ?? ''}'),
              subtitle: Text('${r['status']} • ${r['message'] ?? ''}'),
              trailing: direction == 'received' && r['status'] == 'PENDING'
                  ? _RespondButtons(requestId: r['id'] as String, direction: direction)
                  : null,
            );
          },
        );
      },
    );
  }
}

class _RespondButtons extends ConsumerWidget {
  const _RespondButtons({required this.requestId, required this.direction});
  final String requestId;
  final String direction;

  Future<void> _respond(WidgetRef ref, BuildContext context, String action) async {
    try {
      await ref.read(apiClientProvider).dio
          .post('/api/v1/contact-requests/$requestId/respond', data: {'action': action});
      ref.invalidate(requestsProvider(direction));
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      IconButton(icon: const Icon(Icons.check, color: Colors.green), onPressed: () => _respond(ref, context, 'ACCEPTED')),
      IconButton(icon: Icon(Icons.close, color: Theme.of(context).colorScheme.error), onPressed: () => _respond(ref, context, 'DECLINED')),
    ]);
  }
}
