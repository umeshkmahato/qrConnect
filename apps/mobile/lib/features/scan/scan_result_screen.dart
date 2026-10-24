import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

/// Permission-aware verification result. The server decides what the scanner
/// may see — this screen just renders the projection it returned.
class ScanResultScreen extends ConsumerWidget {
  const ScanResultScreen({super.key, required this.result});
  final Map<String, dynamic> result;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final outcome = result['outcome'] as String? ?? 'ERROR';
    final vehicle = result['vehicle'] as Map<String, dynamic>? ?? {};
    final verified = outcome == 'VERIFIED';

    return Scaffold(
      appBar: AppBar(title: const Text('Verification')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Icon(
            verified ? Icons.verified : Icons.error_outline,
            size: 64,
            color: verified ? Colors.green : Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              verified ? 'Verified' : (result['message'] as String? ?? outcome),
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          const SizedBox(height: 16),
          if (verified) ...[
            ListTile(title: const Text('Registration'), subtitle: Text('${vehicle['registrationNumber'] ?? 'Hidden by owner'}')),
            ListTile(title: const Text('Status'), subtitle: Text('${vehicle['verificationStatus']}')),
            if (vehicle['ownerName'] != null)
              ListTile(title: const Text('Owner'), subtitle: Text('${vehicle['ownerName']}')),
            if (vehicle['organizationName'] != null)
              ListTile(title: const Text('Organization'), subtitle: Text('${vehicle['organizationName']}')),
            if (result['contactRequestsEnabled'] == true)
              FilledButton.icon(
                icon: const Icon(Icons.contact_phone),
                label: const Text('Request contact with owner'),
                onPressed: () => _requestContact(context, ref, vehicle['id'] as String),
              ),
          ],
          const SizedBox(height: 12),
          OutlinedButton(onPressed: () => context.pop(), child: const Text('Scan another')),
        ],
      ),
    );
  }

  Future<void> _requestContact(BuildContext context, WidgetRef ref, String vehicleId) async {
    final category = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          for (final (v, l) in [('PARKING', 'Parking issue'), ('BLOCKED_VEHICLE', 'Blocked vehicle'), ('SECURITY', 'Security concern'), ('DELIVERY', 'Delivery'), ('OTHER', 'Other')])
            ListTile(title: Text(l), onTap: () => Navigator.pop(c, v)),
        ]),
      ),
    );
    if (category == null || !context.mounted) return;
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/contact-requests', data: {
        'vehicleId': vehicleId, 'category': category,
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contact request sent to the owner.')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    }
  }
}
