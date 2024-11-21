import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './application/auth/auth.service';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FacadeModule } from './application/facades/facade.module';
import { DatabaseModule } from './infra/db/db.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationInterceptor } from './common/interceptor/validation-interceptor';
import { HttpExceptionFilter } from './common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경변수 모듈을 글로벌로 설정
      envFilePath: ['.env'], // 환경변수 파일 경로
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    FacadeModule,
  ],
  controllers: [],
  providers: [
    AppService,
    ConfigService,
    AuthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ValidationInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})

// 모든 루트에서 발생하는 요청에 대해 LoggerMiddleware를 적용
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
