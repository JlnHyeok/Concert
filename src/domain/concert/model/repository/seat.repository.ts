import { EntityManager } from 'typeorm';
import { Seat } from '../entity/seat.entity';

export const SEAT_REPOSITORY = 'SEAT_REPOSITORY';

export interface ISeatRepository {
  findById(id: number): Promise<Seat | null>;
  findAll(): Promise<Seat[]>;
  findByConcertAndDate(
    concertId: number,
    concertDate: Date,
    manager: EntityManager,
  ): Promise<Seat[] | null>;
  createSeat(seat: Seat): Promise<Seat>;
  updateSeat(
    seatId: number,
    updateSeat: Seat,
    manager: EntityManager,
  ): Promise<Seat>;
  deleteSeat(id: number): Promise<void>;
}
