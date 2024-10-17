import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ type: 'decimal', default: 0 })
  balance: number;
}
