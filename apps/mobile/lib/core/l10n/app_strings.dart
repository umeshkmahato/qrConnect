import 'package:flutter/widgets.dart';

/// Minimal English/Hindi string table (no codegen dependency).
/// Extend entries here as screens grow; keys are stable identifiers.
class AppStrings {
  AppStrings(this.locale);
  final Locale locale;

  static const delegate = _AppStringsDelegate();
  static const supportedLocales = [Locale('en'), Locale('hi')];

  static AppStrings of(BuildContext context) =>
      Localizations.of<AppStrings>(context, AppStrings) ?? AppStrings(const Locale('en'));

  static const _t = <String, Map<String, String>>{
    'app_title': {'en': 'NathConnect', 'hi': 'नाथ कनेक्ट'},
    'login_title': {'en': 'Sign in with your phone', 'hi': 'अपने फ़ोन से साइन इन करें'},
    'send_otp': {'en': 'Send OTP', 'hi': 'ओटीपी भेजें'},
    'verify': {'en': 'Verify', 'hi': 'सत्यापित करें'},
    'my_vehicles': {'en': 'My vehicles', 'hi': 'मेरे वाहन'},
    'scan_qr': {'en': 'Scan QR', 'hi': 'QR स्कैन करें'},
    'contact_requests': {'en': 'Contact requests', 'hi': 'संपर्क अनुरोध'},
    'notifications': {'en': 'Notifications', 'hi': 'सूचनाएं'},
    'profile': {'en': 'Profile', 'hi': 'प्रोफ़ाइल'},
    'register_vehicle': {'en': 'Register vehicle', 'hi': 'वाहन पंजीकृत करें'},
    'privacy_settings': {'en': 'Privacy settings', 'hi': 'गोपनीयता सेटिंग'},
    'accept': {'en': 'Accept', 'hi': 'स्वीकार करें'},
    'decline': {'en': 'Decline', 'hi': 'अस्वीकार करें'},
    'report_abuse': {'en': 'Report abuse', 'hi': 'दुरुपयोग की रिपोर्ट करें'},
    'retry': {'en': 'Retry', 'hi': 'पुनः प्रयास'},
    'empty_list': {'en': 'Nothing here yet', 'hi': 'यहाँ अभी कुछ नहीं है'},
    'permission_denied': {'en': 'Permission denied', 'hi': 'अनुमति अस्वीकृत'},
  };

  String t(String key) => _t[key]?[locale.languageCode] ?? _t[key]?['en'] ?? key;
}

class _AppStringsDelegate extends LocalizationsDelegate<AppStrings> {
  const _AppStringsDelegate();
  @override
  bool isSupported(Locale locale) => ['en', 'hi'].contains(locale.languageCode);
  @override
  Future<AppStrings> load(Locale locale) async => AppStrings(locale);
  @override
  bool shouldReload(_AppStringsDelegate old) => false;
}
