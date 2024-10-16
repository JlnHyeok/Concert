import { Injectable } from '@nestjs/common';
import { Seat } from 'src/domain/concert/model/entity/seat.entity';
import { ISeatRepository } from 'src/domain/concert/model/repository/seat.repository';
import { Repository } from 'typeorm';

@Injectable()
export class SeatRepository
  extends Repository<Seat>
  implements ISeatRepository
{
  async findAll(): Promise<Seat[]> {
    return await this.find();
  }

  async findByConcertAndDate(
    concertId: number,
    concertDate: string,
  ): Promise<Seat | null> {
    return await this.findOne({
      where: {
        concert_id: concertId,
        performance_date: concertDate,
      },
    });
  }

  async createSeat(seat: Seat): Promise<Seat> {
    return await this.save(seat);
  }

  async updateSeat(
    concertId: number,
    performanceDate: string,
    updateSeat: Seat,
  ): Promise<Seat> {
    const seat = await this.findByConcertAndDate(concertId, performanceDate);

    if (!seat) {
      return null;
    }

    Object.assign(seat, updateSeat);
    return await this.save(seat);
  }

  async deleteSeat(id: number): Promise<void> {
    await this.delete(id);
  }
}
