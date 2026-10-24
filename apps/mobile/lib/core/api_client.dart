import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'session.dart';

const kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

/// Typed API client: attaches the access token, retries idempotent requests
/// once on network failure, and transparently refreshes expired sessions via
/// the refresh-token rotation endpoint.
class ApiClient {
  ApiClient(this._session)
      : dio = Dio(BaseOptions(
          baseUrl: kApiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 20),
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = _session.accessToken;
        if (token != null && !options.path.contains('/auth/')) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 &&
            !options_retryMarked(e.requestOptions) &&
            _session.refreshToken != null) {
          final refreshed = await _refresh();
          if (refreshed) {
            final req = e.requestOptions;
            req.headers['Authorization'] = 'Bearer ${_session.accessToken}';
            req.extra['retried'] = true;
            try {
              handler.resolve(await dio.fetch(req));
            } catch (err) {
              handler.next(e);
            }
            return;
          }
        }
        handler.next(e);
      },
    ));
  }

  final SessionStore _session;
  final Dio dio;

  static bool options_retryMarked(RequestOptions o) => o.extra['retried'] == true;

  Future<bool> _refresh() async {
    try {
      final res = await dio.post('/api/v1/auth/session/refresh',
          data: {'refreshToken': _session.refreshToken});
      await _session.save(
        accessToken: res.data['accessToken'] as String,
        refreshToken: res.data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await _session.clear();
      return false;
    }
  }
}

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(sessionStoreProvider)),
);

/// Friendly error mapping for UI states.
String apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) return data['message'] as String;
    if (error.type == DioExceptionType.connectionError) {
      return 'No connection. Please check your network and retry.';
    }
  }
  return 'Something went wrong. Please try again.';
}
