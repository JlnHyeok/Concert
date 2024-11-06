import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class WaitingQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  status: 'WAITING' | 'PROCESSING' | 'EXPIRED';

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expireAt: Date | null;
}
