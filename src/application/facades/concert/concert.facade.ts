import { Inject, Injectable } from '@nestjs/common';
import { ConcertService } from '../../../domain/concert/service/consert.service';

@Injectable()
export class ConcertFacade {
  constructor(
    @Inject(ConcertService)
    private readonly concertService: ConcertService,
  ) {}
  async createConcert(name: string, location: string) {
    const res = await this.concertService.createConcert(name, location);
    return { id: res.id, name: res.name, location: res.location };
  }

  async seedConcerts() {
    await this.concertService.seedConcerts();
  }

  async seedPerformanceDates() {
    await this.concertService.seedPerformanceDates();
  }

  async seedSeats() {
    await this.concertService.seedSeats();
  }

  async createPerformanceDate(concertId: number, performanceDate: Date) {
    const res = await this.concertService.createPerformanceDate(
      concertId,
      performanceDate,
    );
    return {
      id: res.id,
      concertId: res.concertId,
      performanceDate: res.performanceDate,
    };
  }

  async createSeat(seat: {
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
    price: number;
  }) {
    const createdSeat = await this.concertService.createSeat(seat);
    return {
      id: createdSeat.id,
      concertId: createdSeat.concertId,
      seatNumber: createdSeat.seatNumber,
      performanceDate: createdSeat.performanceDate,
      price: createdSeat.price,
      status: createdSeat.status,
    };
  }
  async getAllConcerts() {
    return await this.concertService.getAllConcerts();
  }

  async getAvailableDates(concertId: number) {
    return await this.concertService.getAvailableDates(concertId);
  }

  async getSeats(concertId: number, performanceDate: Date) {
    const seats = await this.concertService.getSeats(
      concertId,
      performanceDate,
    );
    return seats.map((seat) => ({
      id: seat.id,
      concertId: seat.concertId,
      seatNumber: seat.seatNumber,
      performanceDate: seat.performanceDate,
      price: seat.price,
      status: seat.status,
      releaseAt: seat.releaseAt,
    }));
  }

  async deleteConcert(concertId: number) {
    return await this.concertService.deleteConcert(concertId);
  }
}
