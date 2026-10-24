import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/api_client.dart';
import '../vehicles/vehicle_detail_screen.dart';

/// QR display, rotate and revoke.
/// The plaintext token is only ever held in memory — the API stores its hash.
class QrDisplayScreen extends ConsumerStatefulWidget {
  const QrDisplayScreen({super.key, required this.vehicleId});
  final String vehicleId;

  @override
  ConsumerState<QrDisplayScreen> createState() => _QrDisplayScreenState();
}

class _QrDisplayScreenState extends ConsumerState<QrDisplayScreen> {
  String? _token;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _rotate(fetchOnly: true);
  }

  /// There is no "get current token" endpoint by design — the QR is shown by
  /// rotating (issuing a fresh token) or immediately after vehicle creation.
  Future<void> _rotate({bool fetchOnly = false}) async {
    setState(() { _busy = true; _error = null; });
    try {
      final res = await ref.read(apiClientProvider).dio
          .post('/api/v1/vehicles/${widget.vehicleId}/qr/rotate');
      setState(() => _token = res.data['qrToken'] as String);
      ref.invalidate(vehicleProvider(widget.vehicleId));
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
    void _unused() => fetchOnly;
  }

  Future<void> _revoke() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Revoke QR code?'),
        content: const Text('Anyone with the old QR will no longer be able to verify this vehicle.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Revoke')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/vehicles/${widget.vehicleId}/qr/revoke');
      setState(() => _token = null);
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle QR')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_token != null)
                QrImageView(data: 'nathconnect:v1:$_token', size: 240, backgroundColor: Colors.white)
              else if (_busy)
                const CircularProgressIndicator()
              else
                const Text('No active QR. Rotate to issue one.'),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              const SizedBox(height: 16),
              const Text('This QR identifies your vehicle to authorized scanners only.'),
              const SizedBox(height: 16),
              Wrap(spacing: 8, children: [
                OutlinedButton.icon(
                  icon: const Icon(Icons.share),
                  label: const Text('Share'),
                  onPressed: _token == null ? null : () => Share.share('NathConnect vehicle QR: nathconnect:v1:$_token'),
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.refresh),
                  label: const Text('Rotate'),
                  onPressed: _busy ? null : _rotate,
                ),
                TextButton.icon(
                  icon: Icon(Icons.block, color: Theme.of(context).colorScheme.error),
                  label: Text('Revoke', style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  onPressed: _busy || _token == null ? null : _revoke,
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
