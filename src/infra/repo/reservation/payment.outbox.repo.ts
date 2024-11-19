import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaymentOutboxMetadata,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../../../domain/reservation/model/entity/payment.outbox.entity';
import { IPaymentOutboxRepository } from '../../../domain/reservation/model/repository/payment.outbox.repository';
import { EntityManager, Repository } from 'typeorm';

export class PaymentOutboxRepository implements IPaymentOutboxRepository {
  constructor(
    @InjectRepository(PaymentOutbox)
    private readonly paymentOutboxRepository: Repository<PaymentOutbox>,
  ) {}
  async getAllPaymentOutboxsByStatus(
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<PaymentOutbox[]> {
    const entityManager = manager
      ? manager.getRepository(PaymentOutbox)
      : this.paymentOutboxRepository;
    return await entityManager.find({
      where: { status },
    });
  }

  async createPaymentOutbox(
    metadata: IPaymentOutboxMetadata,
    manager: EntityManager,
  ): Promise<PaymentOutbox> {
    const entityManager = manager
      ? manager.getRepository(PaymentOutbox)
      : this.paymentOutboxRepository;
    const paymentOutbox = new PaymentOutbox();
    paymentOutbox.status = PaymentOutboxStatus.INIT;
    paymentOutbox.metadata = metadata;
    return await entityManager.save(paymentOutbox);
  }

  async updatePaymentOutbox(
    id: number,
    status: PaymentOutboxStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const entityManager = manager
      ? manager.getRepository(PaymentOutbox)
      : this.paymentOutboxRepository;

    const paymentOutbox = await entityManager.findOne({
      where: { id },
    });

    paymentOutbox.status = status;
    await entityManager.save(paymentOutbox);
  }
}
