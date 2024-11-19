import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PaymentCreatedEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  metadata: IPaymentCreatedEventMetadata;

  @Column()
  status: PaymentCreatedEventStatus;

  @CreateDateColumn()
  createdAt: Date;
}

export enum PaymentCreatedEventStatus {
  INIT = 'INIT',
  PUBLISHED = 'PUBLISHED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

export interface IPaymentCreatedEventMetadata {
  userId: number;
  token: string;
  price: number;
  reservationId: number;
  seatId: number;
}
