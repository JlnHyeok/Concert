import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WaitingQueue } from '../../domain/waiting-queue/model/entity/waiting-queue.entity';
import { User } from '../../domain/user/model/entity/user.entity';
import { Concert } from '../../domain/concert/model/entity/concert.entity';
import { PerformanceDate } from '../../domain/concert/model/entity/performance-date.entity';
import { Payment } from '../../domain/reservation/model/entity/payment.entity';
import { Reservation } from '../../domain/reservation/model/entity/reservation.entity';
import { Seat } from '../../domain/concert/model/entity/seat.entity';
import { typeOrmConfigFactory } from './typeorm/typeorm.config';
import { Balance } from '../../domain/user/model/entity/balance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경변수 모듈을 글로벌로 설정
      envFilePath: ['.env'], // 환경변수 파일 경로
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfigFactory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      WaitingQueue,
      User,
      Concert,
      PerformanceDate,
      Balance,
      Payment,
      Reservation,
      Seat,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
