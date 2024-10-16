import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'decimal', default: 0 })
  balance: number;
}
