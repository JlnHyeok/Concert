import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(
        () => {},
        (error) => {
          if (error instanceof BadRequestException) {
            // 에러를 처리
            throw new BadRequestException(
              'Validation failed',
              error.getResponse(),
            );
          }
        },
      ),
    );
  }
}
