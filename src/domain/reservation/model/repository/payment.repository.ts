import { Payment } from '../entity/payment.entity';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface IPaymentRepository {
  createPayment(payment: Payment): Promise<Payment>;
}
