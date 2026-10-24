import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

final vehicleProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  final res = await ref.watch(apiClientProvider).dio.get('/api/v1/vehicles/$id');
  return res.data as Map<String, dynamic>;
});

class VehicleDetailScreen extends ConsumerWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});
  final String vehicleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final v = ref.watch(vehicleProvider(vehicleId));
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle')),
      body: v.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (vehicle) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(vehicle['registrationNumber'] as String,
                style: Theme.of(context).textTheme.headlineMedium),
            Chip(label: Text(vehicle['status'] as String)),
            const SizedBox(height: 8),
            Text('${vehicle['vehicleType']} ${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''}'),
            const SizedBox(height: 24),
            FilledButton.icon(
              icon: const Icon(Icons.qr_code),
              label: const Text('Show QR code'),
              onPressed: () => context.push('/vehicles/$vehicleId/qr'),
            ),
            OutlinedButton.icon(
              icon: const Icon(Icons.privacy_tip_outlined),
              label: const Text('Sharing & privacy'),
              onPressed: () => context.push('/privacy', extra: vehicleId),
            ),
          ],
        ),
      ),
    );
  }
}
