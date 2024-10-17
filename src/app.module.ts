import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './infra/database/database.module';
import { WaitingQueueController } from './presentation/controller/waiting-queue.controller';
import { RESERVATION_REPOSITORY } from './domain/reservation/model/repository/reservation.repository';
import { ReservationRepository } from './infra/repositories/reservation.repository';
import { CONCERT_REPOSITORY } from './domain/concert/model/repository/concert.repository';
import { USER_REPOSITORY } from './domain/user/model/repository/user.repository';
import { BALANCE_REPOSITORY } from './domain/user/model/repository/balance.repository';
import { PERFORMANCE_DATE_REPOSITORY } from './domain/concert/model/repository/performance-date.repository';
import { WAITING_QUEUE_REPOSITORY } from './domain/waiting-queue/model/repository/waiting-queue.repository';
import { BalanceRepository } from './infra/repositories/balance.repository';
import { ConcertRepository } from './infra/repositories/concert.repository';
import { PerformanceDateRepository } from './infra/repositories/performance-date.repository';
import { UserRepository } from './infra/repositories/user.repository';
import { WaitingQueueRepository } from './infra/repositories/waiting-queue.repository';
import { PAYMENT_REPOSITORY } from './domain/reservation/model/repository/payment.repository';
import { PaymentRepository } from './infra/repositories/payment.repository';
import { WaitingQueueService } from './domain/waiting-queue/services/waiting-queue.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UserService } from './domain/user/services/user.service';
import { ConcertService } from './domain/concert/service/consert.service';
import { ReservationService } from './domain/reservation/service/reservation.service';
import { ReservationFacade } from './application/facades/reservation.facade';
import { SEAT_REPOSITORY } from './domain/concert/model/repository/seat.repository';
import { SeatRepository } from './infra/repositories/seat.repository';
import { UserController } from './presentation/controller/user.controller';
import { ConcertController } from './presentation/controller/concert.controller';
import { ReservationController } from './presentation/controller/reservation.controller';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [
    WaitingQueueController,
    UserController,
    ConcertController,
    ReservationController,
  ],
  providers: [
    AppService,
    WaitingQueueService,
    UserService,
    ConcertService,
    ReservationService,
    ReservationFacade,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: BALANCE_REPOSITORY, useClass: BalanceRepository },
    { provide: WAITING_QUEUE_REPOSITORY, useClass: WaitingQueueRepository },
    { provide: RESERVATION_REPOSITORY, useClass: ReservationRepository },
    { provide: SEAT_REPOSITORY, useClass: SeatRepository },
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository },
    { provide: CONCERT_REPOSITORY, useClass: ConcertRepository },
    {
      provide: PERFORMANCE_DATE_REPOSITORY,
      useClass: PerformanceDateRepository,
    },
  ],
})
export class AppModule {}
