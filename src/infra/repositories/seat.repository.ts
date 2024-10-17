import { Injectable } from '@nestjs/common';
import { Seat } from 'src/domain/concert/model/entity/seat.entity';
import { ISeatRepository } from 'src/domain/concert/model/repository/seat.repository';
import { Repository } from 'typeorm';

@Injectable()
export class SeatRepository
  extends Repository<Seat>
  implements ISeatRepository
{
  async findById(id: number): Promise<Seat> {
    return await this.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<Seat[]> {
    return await this.findAll();
  }

  async findByConcertAndDate(
    concertId: number,
    concertDate: Date,
  ): Promise<Seat[] | null> {
    return await this.find({
      where: {
        concertId,
        performanceDate: concertDate,
      },
    });
  }

  async createSeat(seat: Seat): Promise<Seat> {
    return await this.save(seat);
  }

  async updateSeat(seatId: number, updateSeat: Seat): Promise<Seat> {
    console.log(seatId);
    const seat = await this.findById(seatId);

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
