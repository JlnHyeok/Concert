import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IReservationRepository,
  RESERVATION_REPOSITORY,
} from '../model/repository/reservation.repository';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../model/repository/payment.repository';
import dayjs from 'dayjs';

@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async getReservation(userId: number) {
    const reservations = await this.reservationRepository.findByUserId(userId);
    if (!reservations.length) {
      throw new NotFoundException(
        `No reservations found for user with ID ${userId}`,
      );
    }
    return reservations;
  }

  async createReservation(userId: number, seatId: number) {
    const reservation = await this.reservationRepository.createReservation(
      userId,
      seatId,
      new Date(),
    );
    return reservation;
  }

  async createPayment(reservationId: number, price: number) {
    const reservation =
      await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID ${reservationId} not found`,
      );
    }

    if (price <= 0) {
      throw new BadRequestException('Price must be greater than zero');
    }

    const payment = await this.paymentRepository.createPayment(
      reservationId,
      price,
      new Date(),
    );
    return payment;
  }
}
