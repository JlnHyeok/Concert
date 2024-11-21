import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class PerformanceDate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  // @Index()
  concertId: number;

  @Column()
  performanceDate: Date;

  @ManyToOne(() => Concert, (concert) => concert.performanceDates)
  concert: Concert;
}
