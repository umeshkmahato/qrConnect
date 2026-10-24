import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/api_client.dart';

/// Camera scanner for authorized staff. Handles permission states and
/// resolves tokens through the backend — the raw token is sent over TLS
/// and never persisted on-device.
class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});
  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final _controller = MobileScannerController();
  bool _handling = false;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handling) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null) return;
    final token = raw.startsWith('nathconnect:v1:') ? raw.substring('nathconnect:v1:'.length) : raw;
    setState(() => _handling = true);
    try {
      final res = await ref.read(apiClientProvider).dio
          .post('/api/v1/qr/resolve', data: {'token': token});
      if (mounted) {
        await context.push('/scan/result', extra: res.data as Map<String, dynamic>);
      }
    } catch (e) {
      if (mounted) {
        await context.push('/scan/result', extra: {
          'outcome': 'ERROR',
          'message': apiErrorMessage(e),
        });
      }
    } finally {
      if (mounted) setState(() => _handling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan vehicle QR')),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, _) => Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.no_photography, size: 48),
                const SizedBox(height: 8),
                Text(error.errorDetails?.message ?? 'Camera unavailable'),
                const Text('Grant camera permission in system settings to scan QR codes.'),
              ]),
            ),
          ),
          if (_handling) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
