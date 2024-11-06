import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    error: { code: string; message: string },
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ message: error.message, errorCode: error.code }, status);
  }
}
