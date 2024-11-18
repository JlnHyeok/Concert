import {
  Inject,
  Injectable,
  HttpStatus,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from '../model/repository/reservation.repository';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../model/repository/payment.repository';
import { DataSource, EntityManager } from 'typeorm'; // EntityManager 추가
import { BusinessException } from '../../../common/exception/business-exception';
import { RESERVATION_ERROR_CODES } from '../error/reservation.error';
import { ClientKafka, EventPattern } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Kafka } from 'kafkajs';

@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly dataSource: DataSource,
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async getReservation(userId: number) {
    const reservations = await this.reservationRepository.findByUserId(userId);
    if (!reservations || reservations.length == 0) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND,
      );
    }
    return reservations;
  }

  async getReservationByUserIdAndSeatId(userId: number, seatId: number) {
    const reservation = await this.reservationRepository.findByUserIdAndSeatId(
      userId,
      seatId,
    );
    if (!reservation) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return reservation;
  }

  async createReservation(userId: number, seat: { id: number; price: number }) {
    const reservations = await this.reservationRepository.findBySeatId(seat.id);
    if (reservations.length > 0) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.SEAT_ALREADY_RESERVED,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const reservation = await this.reservationRepository.createReservation(
      userId,
      seat.id,
      new Date(),
    );

    return reservation;
  }

  async createPayment(reservationId: number, price: number) {
    if (price < 0) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.PRICE_INVALID,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const reservation =
      await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const payment = await this.paymentRepository.createPayment(
      reservationId,
      price,
      new Date(),
    );

    return payment;
  }

  async deleteReservationBySeatId(seatId: number) {
    return this.reservationRepository.deleteBySeatId(seatId);
  }
}
