import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';

class ReportScreen extends ConsumerStatefulWidget {
  const ReportScreen({super.key, this.context_});
  final Map<String, String?>? context_;
  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  final _reason = TextEditingController();
  final _details = TextEditingController();
  bool _busy = false;

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/abuse-reports', data: {
        'reason': _reason.text.trim(),
        'details': _details.text.trim(),
        ...?widget.context_?.entries.fold<Map<String, String>>({}, (m, e) => e.value == null ? m : (m..[e.key] = e.value!)),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted. Thank you.')));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report abuse')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _reason,
            decoration: const InputDecoration(labelText: 'Reason', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _details,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Details (optional)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy || _reason.text.trim().isEmpty ? null : _submit,
            child: const Text('Submit report'),
          ),
        ],
      ),
    );
  }
}
