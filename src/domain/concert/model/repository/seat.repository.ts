import { EntityManager } from 'typeorm';
import { Seat } from '../entity/seat.entity';

export const SEAT_REPOSITORY = 'SEAT_REPOSITORY';

export interface ISeatRepository {
  findById(id: number): Promise<Seat | null>;
  findAll(): Promise<Seat[]>;
  findByConcertAndDate(
    concertId: number,
    performanceDate: Date,
    manager?: EntityManager,
  ): Promise<Seat[] | null>;
  findByConcertAndDateAndSeatNumber(
    concertId: number,
    performanceDate: Date,
    seatNumber: number,
    manager: EntityManager,
  ): Promise<Seat | null>;
  createSeat(seat: {
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
    price: number;
  }): Promise<Seat>;
  updateSeat(
    seatId: number,
    updateSeat: Seat,
    manager: EntityManager,
  ): Promise<Seat>;
  deleteSeat(id: number): Promise<void>;
  deleteSeatByConcertId(concertId: number): Promise<void>;
  seedSeats(): Promise<void>;
}
