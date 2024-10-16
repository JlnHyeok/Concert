import { Seat } from '../entity/seat.entity';

export const SEAT_REPOSITORY = 'SEAT_REPOSITORY';

export interface ISeatRepository {
  findAll(): Promise<Seat[]>;
  findByConcertAndDate(concertId: number, concertDate: string): Promise<Seat>;
  createSeat(seat: Seat): Promise<Seat>;
  updateSeat(
    concertId: number,
    performanceDate: string,
    seat: Seat,
  ): Promise<Seat>;
  deleteSeat(id: number): Promise<void>;
}
