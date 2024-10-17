import { Injectable } from '@nestjs/common';
import { Payment } from '../../domain/reservation/model/entity/payment.entity';
import { IPaymentRepository } from '../../domain/reservation/model/repository/payment.repository';
import { Repository, EntityManager } from 'typeorm';

@Injectable()
export class PaymentRepository
  extends Repository<Payment>
  implements IPaymentRepository
{
  async createPayment(
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment> {
    return await this.save({ reservationId, price, createdAt });
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
