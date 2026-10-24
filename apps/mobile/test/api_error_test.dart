import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nathconnect/core/api_client.dart';

void main() {
  group('apiErrorMessage', () {
    test('extracts server message', () {
      final e = DioException(
        requestOptions: RequestOptions(path: '/x'),
        response: Response(
          requestOptions: RequestOptions(path: '/x'),
          statusCode: 403,
          data: {'code': 'FORBIDDEN', 'message': 'Access denied'},
        ),
      );
      expect(apiErrorMessage(e), 'Access denied');
    });

    test('connection error gives friendly message', () {
      final e = DioException(
        requestOptions: RequestOptions(path: '/x'),
        type: DioExceptionType.connectionError,
      );
      expect(apiErrorMessage(e), contains('connection'));
    });
  });
}
