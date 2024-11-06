import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Concert } from './concert.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
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
