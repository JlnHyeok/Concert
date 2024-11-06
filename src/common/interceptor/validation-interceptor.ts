import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BusinessException } from '../exception/business-exception';
import { COMMON_ERRORS } from '../constants/error';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(
        () => {},
        (error) => {
          if (error instanceof BadRequestException) {
            // 에러를 처리
            throw new BusinessException(
              COMMON_ERRORS.BAD_REQUEST,
              HttpStatus.BAD_REQUEST,
            );
          }
        },
      ),
    );
  }
}
