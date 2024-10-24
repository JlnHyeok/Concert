import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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
import { DataSource } from 'typeorm'; // DataSource import
import { BusinessException } from '../../../common/exception/business-exception';
import { CONCERT_ERROR_CODES } from '../error/concert.error';

@Injectable()
export class ConcertService {
  constructor(
    @Inject(CONCERT_REPOSITORY)
    private readonly concertRepository: IConcertRepository,
    @Inject(SEAT_REPOSITORY)
    private readonly seatRepository: ISeatRepository,
    @Inject(PERFORMANCE_DATE_REPOSITORY)
    private readonly performanceDateRepository: IPerformanceDateRepository,
    private readonly dataSource: DataSource, // DataSource 주입
  ) {}

  async getSeat(id: number): Promise<Seat> {
    const seat = await this.seatRepository.findById(id);
    if (!seat) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return seat;
  }

  async getSeats(concertId: number, performanceDate: string): Promise<Seat[]> {
    return await this.dataSource.transaction(async (manager) => {
      const seats = await this.seatRepository.findByConcertAndDate(
        concertId,
        new Date(performanceDate),
        manager, // 트랜잭션 매니저 전달
      );
      if (!seats || seats.length === 0) {
        throw new BusinessException(
          CONCERT_ERROR_CODES.SEATS_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      return seats;
    });
  }

  async getAllSeats(): Promise<Seat[]> {
    return await this.seatRepository.findAll();
  }

  async getAvailableDates(concertId: number): Promise<PerformanceDate[]> {
    const dates =
      await this.performanceDateRepository.findByConcertId(concertId);
    if (!dates || dates.length === 0) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.PERFORMANCE_DATE_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return dates;
  }

  async updateSeat(seatId: number, seat: Seat): Promise<Seat> {
    return await this.dataSource.transaction(async (manager) => {
      const updatedSeat = await this.seatRepository.updateSeat(
        seatId,
        seat,
        manager,
      );
      if (!updatedSeat) {
        throw new BusinessException(
          CONCERT_ERROR_CODES.UPDATE_SEAT_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }
      return updatedSeat;
    });
  }
}
