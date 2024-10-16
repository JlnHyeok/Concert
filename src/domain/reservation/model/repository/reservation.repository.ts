import { Reservation } from '../entity/reservation.entity';

export const RESERVATION_REPOSITORY = 'RESERVATION_REPOSITORY';

export interface IReservationRepository {
  createReservation(reservation: Reservation): Promise<Reservation>;
  deleteReservation(id: number): Promise<void>;
}
