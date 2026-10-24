import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/session.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.phone});
  final String phone;
  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _verify() async {
    setState(() { _busy = true; _error = null; });
    try {
      final res = await ref.read(apiClientProvider).dio.post(
        '/api/v1/auth/otp/verify',
        data: {'phone': widget.phone, 'code': _code.text.trim()},
      );
      await ref.read(sessionStoreProvider).save(
        accessToken: res.data['accessToken'] as String,
        refreshToken: res.data['refreshToken'] as String,
      );
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('OTP verification')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Code sent to ${widget.phone}'),
            const SizedBox(height: 16),
            TextField(
              controller: _code,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(labelText: '6-digit code', border: OutlineInputBorder()),
            ),
            if (_error != null)
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _busy || _code.text.length != 6 ? null : _verify,
              child: Text(_busy ? 'Verifying…' : 'Verify'),
            ),
          ],
        ),
      ),
    );
  }
}
