import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
// @Index(['concertId', 'performanceDate'])
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  concertId: number;

  @Column()
  seatNumber: number;

  @Column()
  performanceDate: Date;

  @Column()
  status: 'AVAILABLE' | 'RESERVED' | 'HOLD';

  @Column({ nullable: true })
  releaseAt: Date | null;

  @Column({ type: 'decimal' })
  price: number;

  @ManyToOne(() => Concert, (concert) => concert.seats)
  concert: Concert;
}
