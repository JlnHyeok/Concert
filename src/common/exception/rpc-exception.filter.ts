import { RpcException } from '@nestjs/microservices';

// HttpException을 RpcException으로 변환하는 데코레이터
export function ToRpcException() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 원래 메서드를 저장
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // 원래 메서드 실행
        return await originalMethod.apply(this, args);
      } catch (err: any) {
        // 예외를 RpcException으로 감싸서 던짐
        const convertedError = {
          code: err.response.errorCode || 'INTERNAL_SERVER_ERROR',
          message: err.response.message || 'Internal Server Error',
        };
        throw new RpcException(convertedError || 'Internal Server Error');
      }
    };

    return descriptor;
  };
}
