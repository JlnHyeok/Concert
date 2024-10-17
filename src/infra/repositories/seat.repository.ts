import { Injectable } from '@nestjs/common';
import { Seat } from '../../domain/concert/model/entity/seat.entity';
import { ISeatRepository } from '../../domain/concert/model/repository/seat.repository';
import { EntityManager, Repository } from 'typeorm';

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
    return await this.find();
  }

  async findByConcertAndDate(
    concertId: number,
    concertDate: Date,
    manager: EntityManager, // 트랜잭션 매니저를 전달받도록 수정
  ): Promise<Seat[] | null> {
    return await manager.find(Seat, {
      where: {
        concertId,
        performanceDate: concertDate,
      },
    });
  }

  async createSeat(seat: Seat): Promise<Seat> {
    return await this.save(seat);
  }

  async updateSeat(
    seatId: number,
    updateSeat: Seat,
    manager: EntityManager,
  ): Promise<Seat> {
    const seat = await this.findById(seatId);
    if (!seat) {
      return null;
    }

    Object.assign(seat, updateSeat);
    return await manager.save(seat); // 트랜잭션 매니저를 사용하여 저장
  }

  async deleteSeat(id: number): Promise<void> {
    await this.delete(id);
  }
}
