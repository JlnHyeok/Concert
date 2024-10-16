import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Concert } from './concert.entity';
import { Seat } from './seat.entity';

@Entity()
export class PerformanceDate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  concert_id: number;

  @Column()
  performance_date: Date;

  @ManyToOne(() => Concert, (concert) => concert.performanceDates)
  concert: Concert;

  @OneToMany(() => Seat, (seat) => seat.performanceDate)
  seats: Seat[];
}
