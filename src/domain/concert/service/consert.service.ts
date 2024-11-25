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
import { EntityManager } from 'typeorm'; // DataSource import
import { BusinessException } from '../../../common/exception/business-exception';
import { CONCERT_ERROR_CODES } from '../error/concert.error';
import { Concert } from '../model/entity/concert.entity';
import { COMMON_ERRORS } from '../../../common';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class ConcertService {
  constructor(
    @Inject(CONCERT_REPOSITORY)
    private readonly concertRepository: IConcertRepository,
    @Inject(SEAT_REPOSITORY)
    private readonly seatRepository: ISeatRepository,
    @Inject(PERFORMANCE_DATE_REPOSITORY)
    private readonly performanceDateRepository: IPerformanceDateRepository,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getAllConcerts(): Promise<Concert[]> {
    return await this.concertRepository.findAll();
  }

  async createConcert(name: string, location: string): Promise<Concert> {
    return await this.concertRepository.createConcert(name, location);
  }

  async seedConcerts(): Promise<void> {
    await this.concertRepository.seedConcerts();
  }
  async seedPerformanceDates(): Promise<void> {
    await this.performanceDateRepository.seedPerformanceDates();
  }
  async seedSeats(): Promise<void> {
    await this.seatRepository.seedSeats();
  }

  async createPerformanceDate(
    concertId: number,
    performanceDate: Date,
  ): Promise<PerformanceDate> {
    return await this.performanceDateRepository.createPerformanceDate(
      concertId,
      performanceDate,
    );
  }

  async createSeat(seat: {
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
    price: number;
  }): Promise<Seat> {
    const { concertId, performanceDate, seatNumber } = seat;
    let createdSeat;
    await this.entityManager.transaction(async (manager) => {
      const seats = await this.seatRepository.findByConcertAndDate(
        concertId,
        performanceDate,
        manager,
      );
      const isExist = seats.some((seat) => seat.seatNumber === seatNumber);
      if (isExist) return;

      createdSeat = await this.seatRepository.createSeat(seat);
    });
    return createdSeat;
  }

  async getSeat(id: number, manager?: EntityManager): Promise<Seat> {
    const seat = await this.seatRepository.findById(id, manager);
    if (!seat) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return seat;
  }

  async getSeats(
    concertId: number,
    performanceDate: Date,
    manager?: EntityManager,
  ): Promise<Seat[]> {
    const seats = await this.seatRepository.findByConcertAndDate(
      concertId,
      performanceDate,
      manager, // 트랜잭션 매니저 전달
    );
    if (!seats || seats.length === 0) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEATS_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return seats;
  }

  async checkAndUpdateSeatStatus(
    concertId: number,
    performanceDate: Date,
    seatNumber: number,
    targetSeatStatus: 'AVAILABLE' | 'HOLD' = 'AVAILABLE',
  ): Promise<Seat> {
    let seat: Seat;
    await this.entityManager.transaction(async (manager) => {
      try {
        seat = await this.checkSeatStatus(
          concertId,
          performanceDate,
          seatNumber,
          targetSeatStatus,
          manager,
        );
        seat.status = 'HOLD';
        seat.releaseAt = new Date(
          new Date().setMinutes(new Date().getMinutes() + 5),
        );
        return await this.updateSeat(seat.id, seat, manager);
      } catch (e) {
        if (e instanceof BusinessException) {
          throw e;
        }
        throw new BusinessException(
          COMMON_ERRORS.INTERNAL_SERVER_ERROR,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
    return seat;
  }

  async checkSeatStatus(
    concertId: number,
    performanceDate: Date,
    seatNumber: number,
    targetSeatStatus: 'AVAILABLE' | 'HOLD' = 'AVAILABLE',
    manager: EntityManager,
  ): Promise<Seat> {
    const seat = await this.seatRepository.findByConcertAndDateAndSeatNumber(
      concertId,
      performanceDate,
      seatNumber,
      manager,
    );
    if (!seat) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (seat.status !== targetSeatStatus) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_UNAVAILABLE,
        HttpStatus.BAD_REQUEST,
      );
    }
    return seat;
  }

  async checkSeatStatusBySeatId(
    seatId: number,
    targetSeatStatus: 'AVAILABLE' | 'HOLD',
    manager?: EntityManager,
  ): Promise<Seat> {
    const seat = await this.seatRepository.findById(seatId, manager);
    if (!seat) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (seat.status !== targetSeatStatus) {
      throw new BusinessException(
        CONCERT_ERROR_CODES.SEAT_UNAVAILABLE,
        HttpStatus.BAD_REQUEST,
      );
    }
    return seat;
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

  async updateSeat(
    seatId: number,
    seat: Seat,
    manager?: EntityManager,
  ): Promise<Seat> {
    if (!manager) {
      return await this.entityManager.transaction(async (manager) => {
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
    } else {
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
    }
  }

  async deleteConcert(id: number): Promise<void> {
    await this.seatRepository.deleteSeatByConcertId(id);
    await this.performanceDateRepository.deletePerformanceDateByConcertId(id);
    await this.concertRepository.deleteConcert(id);
  }
}
