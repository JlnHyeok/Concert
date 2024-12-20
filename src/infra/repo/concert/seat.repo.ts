import { InjectRepository } from '@nestjs/typeorm';
import { ISeatRepository } from '../../../domain/concert/model/repository/seat.repository';
import { Repository, EntityManager, Between } from 'typeorm';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';

export class SeatRepository implements ISeatRepository {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async findById(id: number, manager?: EntityManager): Promise<Seat> {
    const entity = manager ? manager.getRepository(Seat) : this.seatRepository;
    return await entity.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<Seat[]> {
    return await this.seatRepository.find();
  }

  async findByConcertAndDate(
    concertId: number,
    performanceDate: Date,
    manager?: EntityManager, // 트랜잭션 매니저를 전달받도록 수정
  ): Promise<Seat[] | null> {
    if (manager) {
      return manager.find(Seat, {
        where: {
          concertId,
          performanceDate,
        },
        lock: { mode: 'pessimistic_write' },
      });
    } else {
      return this.seatRepository.find({
        where: {
          concertId,
          performanceDate,
        },
      });
    }
  }

  async findByConcertAndDateAndSeatNumber(
    concertId: number,
    performanceDate: Date,
    seatNumber: number,
    manager: EntityManager,
  ): Promise<Seat | null> {
    const startOfDay = new Date(new Date(performanceDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(
      new Date(performanceDate).setHours(23, 59, 59, 999),
    );
    return await manager.findOne(Seat, {
      where: {
        concertId,
        seatNumber,
        performanceDate: Between(startOfDay, endOfDay),
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
    const seat = await manager
      .createQueryBuilder(Seat, 'seat')
      .setLock('pessimistic_write')
      .where('id = :id', { id: seatId })
      .getOne();

    if (!seat) {
      return null;
    }

    return await manager
      .createQueryBuilder()
      .update(Seat)
      .set(updateSeat)
      .where('id = :id', { id: seatId })
      .execute()
      .then(() => updateSeat);
  }

  async deleteSeat(id: number): Promise<void> {
    await this.seatRepository.delete(id);
  }

  async deleteSeatByConcertId(concertId: number): Promise<void> {
    await this.seatRepository.delete({ concertId });
  }

  async seedSeats(): Promise<void> {
    const seats = [];
    for (let i = 1; i <= 10; i++) {
      for (let j = 0; j <= 6; j++) {
        for (let k = 1; k <= 100; k++) {
          const seat = new Seat();
          seat.concertId = i;
          seat.performanceDate = new Date(
            new Date().setDate(new Date().getDate() + j),
          );
          seat.seatNumber = k;
          seat.price = 10000 * ((k % 5) + 1);
          seat.status = 'AVAILABLE';
          seat.releaseAt = null;
          seats.push(seat);
        }
      }

      if (seats.length % 200 == 0) {
        await this.seatRepository.save(seats);
      }
    }
  }
}
