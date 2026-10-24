import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../home/home_screen.dart';
import 'vehicles_screen.dart';

class RegisterVehicleScreen extends ConsumerStatefulWidget {
  const RegisterVehicleScreen({super.key});
  @override
  ConsumerState<RegisterVehicleScreen> createState() => _RegisterVehicleScreenState();
}

class _RegisterVehicleScreenState extends ConsumerState<RegisterVehicleScreen> {
  final _form = GlobalKey<FormState>();
  final _reg = TextEditingController();
  String _type = 'CAR';
  String? _orgId;
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _orgId == null) return;
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(apiClientProvider).dio.post('/api/v1/vehicles', data: {
        'orgId': _orgId,
        'registrationNumber': _reg.text.trim(),
        'vehicleType': _type,
      });
      ref.invalidate(myVehiclesProvider);
      if (mounted) context.pop();
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final memberships = ref.watch(membershipsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Register vehicle')),
      body: memberships.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(apiErrorMessage(e))),
        data: (ms) {
          final orgs = ms.where((m) => m['status'] == 'APPROVED').toList();
          _orgId ??= orgs.isNotEmpty ? orgs.first['org']['id'] as String : null;
          return Form(
            key: _form,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                DropdownButtonFormField<String>(
                  value: _orgId,
                  decoration: const InputDecoration(labelText: 'Organization', border: OutlineInputBorder()),
                  items: orgs.map<DropdownMenuItem<String>>((m) => DropdownMenuItem(
                        value: m['org']['id'] as String,
                        child: Text(m['org']['name'] as String),
                      )).toList(),
                  onChanged: (v) => setState(() => _orgId = v),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _reg,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    labelText: 'Registration number', hintText: 'MH12AB1234', border: OutlineInputBorder()),
                  validator: (v) {
                    final n = (v ?? '').toUpperCase().replaceAll(RegExp('[^A-Z0-9]'), '');
                    return (n.length < 6 || n.length > 13) ? 'Enter a valid registration number' : null;
                  },
                ),
                const SizedBox(height: 12),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'CAR', label: Text('Car')),
                    ButtonSegment(value: 'BIKE', label: Text('Bike')),
                    ButtonSegment(value: 'SCOOTER', label: Text('Scooter')),
                    ButtonSegment(value: 'OTHER', label: Text('Other')),
                  ],
                  selected: {_type},
                  onSelectionChanged: (s) => setState(() => _type = s.first),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: Text(_busy ? 'Submitting…' : 'Submit for approval'),
                ),
                const SizedBox(height: 8),
                const Text('Your organization may need to approve the vehicle before its QR becomes active.'),
              ],
            ),
          );
        },
      ),
    );
  }
}
