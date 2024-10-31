import { InjectRepository } from '@nestjs/typeorm';
import { ISeatRepository } from '../../../domain/concert/model/repository/seat.repository';
import { Repository, EntityManager } from 'typeorm';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';

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
    performanceDate: Date,
    manager: EntityManager, // 트랜잭션 매니저를 전달받도록 수정
  ): Promise<Seat[] | null> {
    return manager.find(Seat, {
      where: {
        concertId,
        performanceDate,
      },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async createSeat(seat: {
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
    price: number;
  }): Promise<Seat> {
    let newSeat = {
      ...seat,
      id: null,
      status: 'AVAILABLE' as 'AVAILABLE',
      releaseAt: null,
    };
    return this.seatRepository.save(newSeat);
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

  async deleteSeatByConcertId(concertId: number): Promise<void> {
    await this.seatRepository.delete({ concertId });
  }
}
