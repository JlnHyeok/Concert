import { EntityManager } from 'typeorm';
import { WaitingQueue } from '../entity/waiting-queue.entity';

export const WAITING_QUEUE_REPOSITORY = 'WAITING_QUEUE_REPOSITORY';

export interface IWaitingQueueRepository {
  findAll(): Promise<WaitingQueue[]>;
  findByUUID(uuid: string): Promise<WaitingQueue | null>;
  findLessThanId(id: number): Promise<WaitingQueue[]>;
  findByStatus(
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED',
  ): Promise<WaitingQueue[]>;
  createWaitingQueue(
    waitingQueue: Partial<WaitingQueue>,
  ): Promise<WaitingQueue>;
  updateWaitingQueue(
    uuid: string,
    updateQueue: WaitingQueue,
  ): Promise<WaitingQueue>;
  deleteWaitingQueue(id: number): Promise<void>;
  findByUUIDWithLock(
    manager: EntityManager,
    uuid: string,
  ): Promise<WaitingQueue | null>;
  findWaitingWithLock(manager: EntityManager): Promise<WaitingQueue[]>;
  updateQueueStatus(
    manager: EntityManager,
    queue: WaitingQueue,
    status: 'PROCESSING' | 'EXPIRED',
    activatedAt?: Date,
    expireAt?: Date,
  ): Promise<WaitingQueue>;
}
