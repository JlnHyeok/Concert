import { Payment } from '../../../domain/reservation/model/entity/payment.entity';
import {
  EntityManager,
  OptimisticLockVersionMismatchError,
  Repository,
} from 'typeorm';
import { IPaymentRepository } from '../../../domain/reservation/model/repository/payment.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['reservation', 'reservation.user'],
    });
  }

  async createPayment(
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment> {
    try {
      return await this.paymentRepository.save({
        reservationId,
        price,
        createdAt,
      });
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException('Optimistic lock error');
      }
    }
  }

  // 추가: 예약과 연관된 결제를 비관적 락으로 생성하는 메서드
  async createPaymentWithLock(
    manager: EntityManager,
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment> {
    return await manager.save(Payment, { reservationId, price, createdAt });
  }
}
