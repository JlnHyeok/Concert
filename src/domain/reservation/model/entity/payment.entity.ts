import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  VersionColumn,
} from 'typeorm';
import { Reservation } from '../../../reservation/model/entity/reservation.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column('decimal')
  price: number;

  @Column('timestamp')
  createdAt: Date;
}
