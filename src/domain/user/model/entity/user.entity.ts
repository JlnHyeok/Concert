import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Reservation } from '../../../reservation/model/entity/reservation.entity';

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[] | null;
}
