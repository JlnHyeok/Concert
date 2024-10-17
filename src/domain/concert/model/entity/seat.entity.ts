import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { PerformanceDate } from './performance-date.entity';
import { Concert } from './concert.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  concertId: number;

  @ManyToOne(() => PerformanceDate, (performanceDate) => performanceDate.seats)
  @Column()
  performanceDate: Date;

  @Column()
  seatNumber: number;

  @Column()
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @Column()
  releaseAt: Date;

  @Column({ type: 'decimal' })
  price: number;

  @ManyToOne(() => Concert, (concert) => concert.seats)
  concert: Concert;
}
