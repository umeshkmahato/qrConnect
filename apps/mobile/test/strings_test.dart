import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nathconnect/core/l10n/app_strings.dart';

void main() {
  test('English and Hindi strings resolve, unknown keys fall back', () {
    expect(AppStrings(const Locale('en')).t('send_otp'), 'Send OTP');
    expect(AppStrings(const Locale('hi')).t('send_otp'), 'ओटीपी भेजें');
    expect(AppStrings(const Locale('en')).t('nonexistent_key'), 'nonexistent_key');
  });
}
