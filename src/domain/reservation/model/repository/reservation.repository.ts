import { EntityManager } from 'typeorm';
import { Reservation } from '../entity/reservation.entity';

export const RESERVATION_REPOSITORY = 'RESERVATION_REPOSITORY';

export interface IReservationRepository {
  findById(id: number, manager?: EntityManager): Promise<Reservation>;
  findBySeatId(seatId: number): Promise<Reservation[]>;
  findByUserId(userId: number): Promise<Reservation[]>;
  findByUserIdAndSeatId(
    userId: number,
    seatId: number,
    manager?: EntityManager,
  ): Promise<Reservation>;
  createReservation(
    userId: number,
    seatId: number,
    createdAt: Date,
  ): Promise<Reservation>;
  deleteReservation(id: number, manager?: EntityManager): Promise<void>;
  findByIdWithLock(
    manager: EntityManager,
    reservationId: number,
  ): Promise<Reservation>;
  findByUserIdWithLock(
    manager: EntityManager,
    userId: number,
  ): Promise<Reservation[]>;
  deleteBySeatId(seatId: number): Promise<void>;
}
