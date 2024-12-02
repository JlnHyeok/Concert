import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { PerformanceDate } from './performance-date.entity';
import { Seat } from './seat.entity';

@Entity()
export class Concert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  location: string;

  @OneToMany(() => Seat, (seat) => seat.concert, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  seats: Seat[];

  @OneToMany(
    () => PerformanceDate,
    (performanceDate) => performanceDate.concert,
    {
      cascade: true,
      onDelete: 'CASCADE',
    },
  )
  performanceDates: PerformanceDate[];
}
