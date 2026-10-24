import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

final myVehiclesProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).dio.get('/api/v1/vehicles');
  return res.data as Map<String, dynamic>;
});

class VehiclesScreen extends ConsumerWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicles = ref.watch(myVehiclesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My vehicles')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/vehicles/register'),
        icon: const Icon(Icons.add),
        label: const Text('Register'),
      ),
      body: vehicles.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(apiErrorMessage(e)),
            TextButton(onPressed: () => ref.invalidate(myVehiclesProvider), child: const Text('Retry')),
          ]),
        ),
        data: (page) {
          final items = page['items'] as List<dynamic>;
          if (items.isEmpty) {
            return const Center(child: Text('No vehicles yet. Register your first one.'));
          }
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (_, i) {
              final v = items[i] as Map<String, dynamic>;
              return ListTile(
                leading: const Icon(Icons.directions_car),
                title: Text(v['registrationNumber'] as String),
                subtitle: Text('${v['vehicleType']} • ${v['status']} • ${v['org']['name']}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/vehicles/${v['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
