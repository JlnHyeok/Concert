import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class WaitingQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  status: 'WAITING' | 'PROCESSING' | 'EXPIRED';

  @Column()
  createdAt: string;

  @Column()
  activatedAt: string;

  @Column()
  expiredAt: string;
}
