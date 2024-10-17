import { Seat } from '../entity/seat.entity';

export const SEAT_REPOSITORY = 'SEAT_REPOSITORY';

export interface ISeatRepository {
  findAll(): Promise<Seat[]>;
  findById(id: number): Promise<Seat>;
  findByConcertAndDate(concertId: number, concertDate: Date): Promise<Seat[]>;
  createSeat(seat: Seat): Promise<Seat>;
  updateSeat(seatId: number, seat: Seat): Promise<Seat>;
  deleteSeat(id: number): Promise<void>;
}
