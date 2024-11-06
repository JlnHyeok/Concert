import { Payment } from '../../../domain/reservation/model/entity/payment.entity';
import { EntityManager, Repository } from 'typeorm';
import { IPaymentRepository } from '../../../domain/reservation/model/repository/payment.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from 'src/domain/reservation/model/entity/reservation.entity';

export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async createPayment(
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment> {
    return await this.paymentRepository.save({
      reservationId,
      price,
      createdAt,
    });
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
