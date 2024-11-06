import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import { EntityManager, Repository } from 'typeorm';
import { IReservationRepository } from '../../../domain/reservation/model/repository/reservation.repository';
import { InjectRepository } from '@nestjs/typeorm';

export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}
  async findById(id: number): Promise<Reservation> {
    return await this.reservationRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: number): Promise<Reservation[]> {
    return await this.reservationRepository.find({ where: { id: userId } });
  }

  async createReservation(
    userId: number,
    seatId: number,
    createdAt: Date,
  ): Promise<Reservation> {
    return await this.reservationRepository.save({ userId, seatId, createdAt });
  }

  async deleteReservation(id: number): Promise<void> {
    await this.reservationRepository.delete(id);
  }

  // 비관적 락을 사용한 메서드 추가
  async findByIdWithLock(
    manager: EntityManager,
    reservationId: number,
  ): Promise<Reservation> {
    return await manager.findOne(Reservation, {
      where: { id: reservationId },
      lock: { mode: 'pessimistic_write' }, // 비관적 락 설정
    });
  }

  async findByUserIdWithLock(
    manager: EntityManager,
    userId: number,
  ): Promise<Reservation[]> {
    return await manager.find(Reservation, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' }, // 비관적 락 설정
    });
  }
}
