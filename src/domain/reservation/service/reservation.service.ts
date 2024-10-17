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
import { DataSource, EntityManager } from 'typeorm'; // EntityManager 추가

@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getReservation(userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const reservations =
        await this.reservationRepository.findByUserIdWithLock(manager, userId);

      if (!reservations.length) {
        throw new NotFoundException(
          `No reservations found for user with ID ${userId}`,
        );
      }
      return reservations;
    });
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
    if (price <= 0) {
      throw new BadRequestException('Price must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const reservation = await this.reservationRepository.findByIdWithLock(
        manager, // 트랜잭션 매니저 전달
        reservationId,
      );

      if (!reservation) {
        throw new NotFoundException(
          `Reservation with ID ${reservationId} not found`,
        );
      }

      const payment = await this.paymentRepository.createPayment(
        reservationId,
        price,
        new Date(),
      );
      return payment;
    });
  }
}
