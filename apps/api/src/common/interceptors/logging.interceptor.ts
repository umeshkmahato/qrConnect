import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';
import { Logger } from '@nestjs/common';

/** Assigns a request id and logs method/path/status/duration. No bodies are logged. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    req.requestId = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('x-request-id', req.requestId);
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`),
        error: () =>
          this.logger.warn(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`),
      }),
    );
  }
}
