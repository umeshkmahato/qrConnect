import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(body: { code: string; message: string }) {
    super(body, HttpStatus.TOO_MANY_REQUESTS);
  }
}
