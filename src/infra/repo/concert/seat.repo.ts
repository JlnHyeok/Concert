import { InjectRepository } from '@nestjs/typeorm';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';
import { ISeatRepository } from '../../../domain/concert/model/repository/seat.repository';
import { Repository, EntityManager } from 'typeorm';

export class SeatRepository implements ISeatRepository {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async findById(id: number): Promise<Seat> {
    return await this.seatRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<Seat[]> {
    return await this.seatRepository.find();
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
    return await this.seatRepository.save(seat);
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
    await this.seatRepository.delete(id);
  }
}
