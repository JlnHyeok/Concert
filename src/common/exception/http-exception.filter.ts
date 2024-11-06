import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    // BusinessException과 일반 예외를 구분
    const errorResponse = exception.getResponse();

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      errorCode: errorResponse['errorCode'] || 'UNEXPECTED_ERROR',
      message: errorResponse['message'] || 'Unexpected error',
    };

    response.status(status).json(responseBody);
  }
}
