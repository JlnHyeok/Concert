import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaymentCreatedEventMetadata,
  PaymentCreatedEvent,
  PaymentCreatedEventStatus,
} from 'src/domain/reservation/model/entity/payment.created.event.entity';
import { IPaymentCreatedEventRepository } from '../../../domain/reservation/model/repository/payment.created.event.repository';
import { EntityManager, Repository } from 'typeorm';

export class PaymentCreatedEventRepository
  implements IPaymentCreatedEventRepository
{
  constructor(
    @InjectRepository(PaymentCreatedEvent)
    private readonly paymentCreatedEventRepository: Repository<PaymentCreatedEvent>,
  ) {}

  async createPaymentCreatedEvent(
    metadata: IPaymentCreatedEventMetadata,
    manager: EntityManager,
  ): Promise<PaymentCreatedEvent> {
    const entityManager = manager
      ? manager.getRepository(PaymentCreatedEvent)
      : this.paymentCreatedEventRepository;
    const paymentCreatedEvent = new PaymentCreatedEvent();
    paymentCreatedEvent.status = PaymentCreatedEventStatus.INIT;
    paymentCreatedEvent.metadata = metadata;
    return await entityManager.save(paymentCreatedEvent);
  }

  async updatePaymentCreatedEvent(
    id: number,
    status: PaymentCreatedEventStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const entityManager = manager
      ? manager.getRepository(PaymentCreatedEvent)
      : this.paymentCreatedEventRepository;

    const paymentCreatedEvent = await entityManager.findOne({
      where: { id },
    });

    paymentCreatedEvent.status = status;
    await entityManager.save(paymentCreatedEvent);
  }
}
