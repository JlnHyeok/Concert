import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from '../model/repository/reservation.repository';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../model/repository/payment.repository';
import { EntityManager } from 'typeorm'; // EntityManager 추가
import { BusinessException } from '../../../common/exception/business-exception';
import { RESERVATION_ERROR_CODES } from '../error/reservation.error';
import {
  IPaymentOutboxRepository,
  PAYMENT_CREATED_EVENT_REPOSITORY,
} from '../model/repository/payment.outbox.repository';
import {
  IPaymentOutboxMetadata,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../model/entity/payment.outbox.entity';

@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_CREATED_EVENT_REPOSITORY)
    private readonly paymentOutboxRepository: IPaymentOutboxRepository,
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

  async getReservationByUserIdAndSeatId(
    userId: number,
    seatId: number,
    manager?: EntityManager,
  ) {
    const reservation = await this.reservationRepository.findByUserIdAndSeatId(
      userId,
      seatId,
      manager,
    );
    if (!reservation) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.RESERVATION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return reservation;
  }

  async getAllPaymentOutboxsByStatus(
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<PaymentOutbox[]> {
    return await this.paymentOutboxRepository.getAllPaymentOutboxsByStatus(
      status,
      manager,
    );
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

  async createPayment(
    reservationId: number,
    price: number,
    manager?: EntityManager,
  ) {
    if (price < 0) {
      throw new BusinessException(
        RESERVATION_ERROR_CODES.PRICE_INVALID,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const reservation = await this.reservationRepository.findById(
      reservationId,
      manager,
    );

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
      manager,
    );

    return payment;
  }

  async createPaymentOutbox(
    metadata: IPaymentOutboxMetadata,
    manager?: EntityManager,
  ): Promise<PaymentOutbox> {
    const paymentOutbox =
      await this.paymentOutboxRepository.createPaymentOutbox(metadata, manager);

    return paymentOutbox;
  }

  async updatePaymentOutbox(
    id: number,
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const paymentOutbox =
      await this.paymentOutboxRepository.updatePaymentOutbox(
        id,
        status,
        manager,
      );

    return paymentOutbox;
  }
  async deleteReservation(id: number, manager?: EntityManager) {
    await this.reservationRepository.deleteReservation(id, manager);
  }

  async deleteReservationBySeatId(seatId: number) {
    return this.reservationRepository.deleteBySeatId(seatId);
  }

  async updatePaymentOutboxStatus(id: number, status: PaymentOutboxStatus) {
    await this.paymentOutboxRepository.updatePaymentOutbox(id, status);
  }
}
