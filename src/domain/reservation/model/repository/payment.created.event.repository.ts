import { EntityManager } from 'typeorm';
import {
  IPaymentCreatedEventMetadata,
  PaymentCreatedEvent,
  PaymentCreatedEventStatus,
} from '../entity/payment.created.event.entity';

export const PAYMENT_CREATED_EVENT_REPOSITORY =
  'PAYMENT_CREATED_EVENT_REPOSITORY';

export interface IPaymentCreatedEventRepository {
  createPaymentCreatedEvent(
    metadata: IPaymentCreatedEventMetadata,
    manager?: EntityManager,
  ): Promise<PaymentCreatedEvent>;
  updatePaymentCreatedEvent(
    id: number,
    status: PaymentCreatedEventStatus,
    manager?: EntityManager,
  ): Promise<void>;
}
