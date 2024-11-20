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
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConcertController } from './presentation/controller/concert/concert.controller';
import { UserController } from './presentation/controller/user/user.controller';
import { ReservationController } from './presentation/controller/reservation/reservation.controller';
import { WaitingQueueController } from './presentation/controller/waiting-queue/waiting-queue.controller';
import { RedisModule } from './infra/redis/redis.module';
import { ClientsModule, KafkaOptions } from '@nestjs/microservices';
import { SET_KAFKA_OPTION } from './common/constants/kafka';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true, // 환경변수 모듈을 글로벌로 설정
      envFilePath: [
        // 환경변수 파일 경로 설정
        // 테스트 환경일 경우 .env.test 파일을 사용하고,
        // 프로덕션 환경일 경우 .env.prod 파일을 사용한다.
        process.env.NODE_ENV == 'test'
          ? '.env.test'
          : process.env.NODE_ENV == 'production'
            ? '.env.prod'
            : '.env',
      ], // 환경변수 파일 경로
    }),
    ClientsModule.registerAsync({
      isGlobal: true,

      clients: [
        {
          inject: [ConfigService],
          name: 'KAFKA_CLIENT',
          useFactory: async (
            configService: ConfigService,
          ): Promise<KafkaOptions> => {
            const url = configService.get<string>('KAFKA_URL', 'localhost');
            const port = configService.get<string>('KAFKA_PORT', '9092');

            return {
              ...SET_KAFKA_OPTION(url, port),
            };
          },
        },
      ],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    FacadeModule,
    RedisModule,
  ],
  controllers: [
    ConcertController,
    UserController,
    ReservationController,
    WaitingQueueController,
  ],
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
