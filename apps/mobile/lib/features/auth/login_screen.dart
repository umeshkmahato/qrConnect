import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/l10n/app_strings.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _phone = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _devOtp;

  Future<void> _sendOtp() async {
    setState(() { _busy = true; _error = null; });
    try {
      final res = await ref.read(apiClientProvider).dio
          .post('/api/v1/auth/otp/request', data: {'phone': _phone.text.trim()});
      _devOtp = res.data['devOtp'] as String?; // dev-only echo
      if (mounted) context.push('/auth/otp', extra: _phone.text.trim());
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = AppStrings.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Text(s.t('app_title'), style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 8),
              Text(s.t('login_title'), style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 24),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: '+91 XXXXX XXXXX',
                  border: OutlineInputBorder(),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                ),
              if (_devOtp != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text('Dev OTP: $_devOtp'),
                ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _busy ? null : _sendOtp,
                child: _busy
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(s.t('send_otp')),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
