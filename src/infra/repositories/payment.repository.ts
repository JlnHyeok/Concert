import { Injectable } from '@nestjs/common';
import { Payment } from 'src/domain/reservation/model/entity/payment.entity';
import { IPaymentRepository } from 'src/domain/reservation/model/repository/payment.repository';
import { Repository } from 'typeorm';

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
}
