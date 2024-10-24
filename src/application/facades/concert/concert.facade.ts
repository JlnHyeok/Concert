import { Inject, Injectable } from '@nestjs/common';
import { ConcertService } from '../../../domain/concert/service/consert.service';

@Injectable()
export class ConcertFacade {
  constructor(
    @Inject(ConcertService)
    private readonly concertService: ConcertService,
  ) {}

  async getAvailableDates(concertId: number) {
    return await this.concertService.getAvailableDates(concertId);
  }

  async getSeats(concertId: number, performanceDate: string) {
    return await this.concertService.getSeats(concertId, performanceDate);
  }
}
