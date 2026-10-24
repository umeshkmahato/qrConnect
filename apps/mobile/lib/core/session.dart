import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure session storage — tokens live in iOS Keychain / Android Keystore,
/// never in SharedPreferences or logs.
class SessionStore {
  static const _accessKey = 'nc_access_token';
  static const _refreshKey = 'nc_refresh_token';
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String? _accessToken;
  String? _refreshToken;

  String? get accessToken => _accessToken;
  bool get hasSession => _refreshToken != null;

  Future<void> load() async {
    _accessToken = await _storage.read(key: _accessKey);
    _refreshToken = await _storage.read(key: _refreshKey);
  }

  Future<void> save({required String accessToken, required String refreshToken}) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    await _storage.write(key: _accessKey, value: accessToken);
    await _storage.write(key: _refreshKey, value: refreshToken);
  }

  Future<void> saveAccessToken(String token) async {
    _accessToken = token;
    await _storage.write(key: _accessKey, value: token);
  }

  String? get refreshToken => _refreshToken;

  Future<void> clear() async {
    _accessToken = null;
    _refreshToken = null;
    await _storage.deleteAll();
  }
}

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());
