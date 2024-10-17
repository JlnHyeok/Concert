import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CONCERT_REPOSITORY,
  IConcertRepository,
} from '../model/repository/concert.repository';
import {
  ISeatRepository,
  SEAT_REPOSITORY,
} from '../model/repository/seat.repository';
import {
  IPerformanceDateRepository,
  PERFORMANCE_DATE_REPOSITORY,
} from '../model/repository/performance-date.repository';
import { Seat } from '../model/entity/seat.entity';
import { PerformanceDate } from '../model/entity/performance-date.entity';
import dayjs from 'dayjs';

@Injectable()
export class ConcertService {
  constructor(
    @Inject(CONCERT_REPOSITORY)
    private readonly concertRepository: IConcertRepository,
    @Inject(SEAT_REPOSITORY)
    private readonly seatRepository: ISeatRepository,
    @Inject(PERFORMANCE_DATE_REPOSITORY)
    private readonly performanceDateRepository: IPerformanceDateRepository,
  ) {}

  async getSeat(id: number): Promise<Seat> {
    const seat = await this.seatRepository.findById(id);
    if (!seat) {
      throw new NotFoundException(`Seat with ID ${id} not found`);
    }
    return seat;
  }

  async getSeats(concertId: number, performanceDate: string): Promise<Seat[]> {
    const seats = await this.seatRepository.findByConcertAndDate(
      concertId,
      new Date(),
    );
    if (!seats || seats.length === 0) {
      throw new NotFoundException(
        `No seats found for concert ID ${concertId} on date ${performanceDate}`,
      );
    }
    return seats;
  }

  async getAllSeats(): Promise<Seat[]> {
    return await this.seatRepository.findAll();
  }

  async getAvailableDates(concertId: number): Promise<PerformanceDate[]> {
    const dates =
      await this.performanceDateRepository.findByConcertId(concertId);
    if (!dates || dates.length === 0) {
      throw new NotFoundException(
        `No available dates found for concert ID ${concertId}`,
      );
    }
    return dates;
  }

  async updateSeat(seatId: number, seat: Seat): Promise<Seat> {
    const updatedSeat = await this.seatRepository.updateSeat(seatId, seat);
    if (!updatedSeat) {
      throw new NotFoundException(
        `Seat with ID ${seatId} not found for update`,
      );
    }
    return updatedSeat;
  }
}
