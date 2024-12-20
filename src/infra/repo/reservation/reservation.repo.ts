import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import {
  EntityManager,
  OptimisticLockVersionMismatchError,
  Repository,
} from 'typeorm';
import { IReservationRepository } from '../../../domain/reservation/model/repository/reservation.repository';
import { InjectRepository } from '@nestjs/typeorm';

export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}
  async findById(id: number, manager?: EntityManager): Promise<Reservation> {
    const entityManager = manager
      ? manager.getRepository(Reservation)
      : this.reservationRepository;
    return await entityManager.findOne({ where: { id } });
  }

  async findBySeatId(seatId: number): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { seat: { id: seatId } },
      relations: ['user', 'seat'],
    });
  }

  async findByUserId(userId: number): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      relations: ['user', 'seat'],
    });
  }

  async findByUserIdAndSeatId(
    userId: number,
    seatId: number,
    manager?: EntityManager,
  ): Promise<Reservation> {
    const entityManager = manager
      ? manager.getRepository(Reservation)
      : this.reservationRepository;

    return await entityManager.findOne({
      where: {
        user: { id: userId },
        seat: { id: seatId },
      },
    });
  }

  async createReservation(
    userId: number,
    seatId: number,
    createdAt: Date,
  ): Promise<Reservation> {
    try {
      return await this.reservationRepository.save({
        id: seatId,
        user: { id: userId },
        seat: { id: seatId },
        createdAt,
      });
    } catch (e) {
      throw OptimisticLockVersionMismatchError;
    }
    // return await this.reservationRepository
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Reservation)
    //   .values({ user: { id: userId }, seat: { id: seatId }, createdAt })
    //   .returning('*')
    //   .execute()
    //   .then((result) => result.raw[0]);
  }

  async deleteReservation(id: number, manager?: EntityManager): Promise<void> {
    const entityManager = manager
      ? manager.getRepository(Reservation)
      : this.reservationRepository;

    await entityManager.delete(id);
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
      relations: ['user', 'seat'],
      lock: { mode: 'pessimistic_write' }, // 비관적 락 설정
    });
  }

  async deleteBySeatId(seatId: number): Promise<void> {
    await this.reservationRepository.delete({ seat: { id: seatId } });
  }
}
