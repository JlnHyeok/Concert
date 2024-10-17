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
}
