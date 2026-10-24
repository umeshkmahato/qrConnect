import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';

final prefsProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, vehicleId) async {
  final res = await ref.watch(apiClientProvider).dio
      .get('/api/v1/privacy/preferences', queryParameters: {'vehicleId': vehicleId});
  return res.data as Map<String, dynamic>?;
});

/// Owner-controlled sharing toggles. Changes apply server-side immediately —
/// no new QR needed.
class PrivacyScreen extends ConsumerStatefulWidget {
  const PrivacyScreen({super.key, required this.vehicleId});
  final String vehicleId;
  @override
  ConsumerState<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends ConsumerState<PrivacyScreen> {
  static const _fields = [
    ('shareRegNumber', 'Show registration number'),
    ('shareOwnerName', 'Show my name'),
    ('shareOrgName', 'Show organization name'),
    ('shareMembershipStatus', 'Show membership status'),
    ('allowContactRequests', 'Allow contact requests'),
    ('allowPublicScan', 'Allow scans by any registered user'),
  ];

  Future<void> _toggle(String key, bool value) async {
    try {
      await ref.read(apiClientProvider).dio.patch('/api/v1/privacy/preferences', data: {
        'vehicleId': widget.vehicleId, key: value,
      });
      ref.invalidate(prefsProvider(widget.vehicleId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(prefsProvider(widget.vehicleId));
    return Scaffold(
      appBar: AppBar(title: const Text('Sharing & privacy')),
      body: prefs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (p) => ListView(
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Choose what authorized scanners can see about this vehicle.'),
            ),
            for (final (key, label) in _fields)
              SwitchListTile(
                title: Text(label),
                value: (p?[key] as bool?) ?? false,
                onChanged: (v) => _toggle(key, v),
              ),
          ],
        ),
      ),
    );
  }
}
