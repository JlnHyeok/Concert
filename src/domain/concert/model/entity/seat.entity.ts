import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PerformanceDate } from './performance-date.entity';
import { Concert } from './concert.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  concert_id: number;

  @Column()
  performance_date: string;

  @Column()
  seatNumber: string;

  @Column()
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @Column({ type: 'decimal' })
  price: number;

  @ManyToOne(() => Concert, (concert) => concert.seats)
  concert: Concert;

  @ManyToOne(() => PerformanceDate, (performanceDate) => performanceDate.seats)
  performanceDate: PerformanceDate;
}
