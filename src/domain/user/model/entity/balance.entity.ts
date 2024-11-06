import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Balance {
  @PrimaryColumn()
  userId: number;

  @Column({ type: 'decimal', default: 0 })
  balance: number;
}
