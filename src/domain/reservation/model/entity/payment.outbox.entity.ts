import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class PaymentOutbox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb' })
  metadata: IPaymentOutboxMetadata;

  @Column()
  status: PaymentOutboxStatus;

  @CreateDateColumn()
  createdAt: Date;
}

export enum PaymentOutboxStatus {
  INIT = 'INIT',
  PUBLISHED = 'PUBLISHED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

export interface IPaymentOutboxMetadata {
  userId: number;
  token: string;
  price: number;
  reservationId: number;
  seatId: number;
}
