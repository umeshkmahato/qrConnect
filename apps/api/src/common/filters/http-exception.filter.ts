import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Consistent error envelope: { statusCode, code, message, requestId }.
 * Internal errors are logged server-side but never leaked to clients.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        code = (b.code as string) ?? exception.name;
        message = Array.isArray(b.message) ? b.message.join('; ') : (b.message as string) ?? exception.message;
      } else {
        code = exception.name;
        message = String(body);
      }
    } else {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      statusCode: status,
      code,
      message,
      requestId: req.requestId,
    });
  }
}
