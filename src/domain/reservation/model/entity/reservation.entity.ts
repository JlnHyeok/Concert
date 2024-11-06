import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  VersionColumn,
  Unique,
} from 'typeorm';
import { User } from '../../../user/model/entity/user.entity';
import { Seat } from '../../../concert/model/entity/seat.entity';

@Entity()
@Unique(['seat'])
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Seat)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column()
  createdAt: Date;

  @VersionColumn()
  version: number;
}
