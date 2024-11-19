import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './model/entity/reservation.entity';
import { Payment } from './model/entity/payment.entity';
import { ReservationService } from './service/reservation.service';
import { RESERVATION_REPOSITORY } from './model/repository/reservation.repository';
import { ReservationRepository } from '../../infra/repo/reservation/reservation.repo';
import { PAYMENT_REPOSITORY } from './model/repository/payment.repository';
import { PaymentRepository } from '../../infra/repo/reservation/payment.repo';
import { PAYMENT_CREATED_EVENT_REPOSITORY } from './model/repository/payment.outbox.repository';
import { PaymentOutboxRepository } from '../../infra/repo/reservation/payment.outbox.repo';
import { PaymentOutbox } from './model/entity/payment.outbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Payment, PaymentOutbox])],
  providers: [
    ReservationService,
    {
      provide: RESERVATION_REPOSITORY,
      useClass: ReservationRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
    {
      provide: PAYMENT_CREATED_EVENT_REPOSITORY,
      useClass: PaymentOutboxRepository,
    },
  ],
  exports: [TypeOrmModule, ReservationService],
})
export class ReservationModule {}
