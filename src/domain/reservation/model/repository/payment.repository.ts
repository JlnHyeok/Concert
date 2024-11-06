import { EntityManager } from 'typeorm';
import { Payment } from '../entity/payment.entity';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface IPaymentRepository {
  findAll(): Promise<Payment[]>;

  createPayment(
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment>;

  createPaymentWithLock(
    manager: EntityManager,
    reservationId: number,
    price: number,
    createdAt: Date,
  ): Promise<Payment>;
}
