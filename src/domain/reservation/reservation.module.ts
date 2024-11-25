import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './model/entity/reservation.entity';
import { Payment } from './model/entity/payment.entity';
import { ReservationService } from './service/reservation.service';
import { RESERVATION_REPOSITORY } from './model/repository/reservation.repository';
import { ReservationRepository } from '../../infra/repo/reservation/reservation.repo';
import { PAYMENT_REPOSITORY } from './model/repository/payment.repository';
import { PaymentRepository } from '../../infra/repo/reservation/payment.repo';
import { PAYMENT_CREATED_EVENT_REPOSITORY } from './model/repository/payment.created.event.repository';
import { PaymentCreatedEventRepository } from '../../infra/repo/reservation/payment.created.event.repo';
import { PaymentCreatedEvent } from './model/entity/payment.created.event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Payment, PaymentCreatedEvent]),
  ],
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
      useClass: PaymentCreatedEventRepository,
    },
  ],
  exports: [TypeOrmModule, ReservationService],
})
export class ReservationModule {}
