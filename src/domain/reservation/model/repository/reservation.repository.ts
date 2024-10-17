import { Reservation } from '../entity/reservation.entity';

export const RESERVATION_REPOSITORY = 'RESERVATION_REPOSITORY';

export interface IReservationRepository {
  findById(id: number): Promise<Reservation>;
  findByUserId(userId: number): Promise<Reservation[]>;
  createReservation(
    userId: number,
    seatId: number,
    createdAt: Date,
  ): Promise<Reservation>;
  deleteReservation(id: number): Promise<void>;
}
