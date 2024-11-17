import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './model/entity/reservation.entity';
import { Payment } from './model/entity/payment.entity';
import { ReservationService } from './service/reservation.service';
import { RESERVATION_REPOSITORY } from './model/repository/reservation.repository';
import { ReservationRepository } from '../../infra/repo/reservation/reservation.repo';
import { PAYMENT_REPOSITORY } from './model/repository/payment.repository';
import { PaymentRepository } from '../../infra/repo/reservation/payment.repo';
import { ClientsModule } from '@nestjs/microservices';
import { KAFKA_OPTION } from 'src/common/constants/kafka';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Payment]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        ...KAFKA_OPTION,
      },
    ]),
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
  ],
  exports: [TypeOrmModule, ReservationService],
})
export class ReservationModule {}
