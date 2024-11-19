import { EntityManager } from 'typeorm';
import {
  IPaymentOutboxMetadata,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../entity/payment.outbox.entity';

export const PAYMENT_CREATED_EVENT_REPOSITORY =
  'PAYMENT_CREATED_EVENT_REPOSITORY';

export interface IPaymentOutboxRepository {
  getAllPaymentOutboxsByStatus(
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<PaymentOutbox[]>;
  createPaymentOutbox(
    metadata: IPaymentOutboxMetadata,
    manager?: EntityManager,
  ): Promise<PaymentOutbox>;
  updatePaymentOutbox(
    id: number,
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<void>;
}
