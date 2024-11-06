import { Injectable } from '@nestjs/common';
import { WaitingQueue } from '../../domain/waiting-queue/model/entity/waiting-queue.entity';
import { IWaitingQueueRepository } from '../../domain/waiting-queue/model/repository/waiting-queue.repository';
import { LessThan, Repository, EntityManager } from 'typeorm';

@Injectable()
export class WaitingQueueRepository
  extends Repository<WaitingQueue>
  implements IWaitingQueueRepository
{
  findAll(): Promise<WaitingQueue[]> {
    throw new Error('Method not implemented.');
  }
  findByUUID(uuid: string): Promise<WaitingQueue | null> {
    throw new Error('Method not implemented.');
  }
  findByStatus(
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED',
  ): Promise<WaitingQueue[]> {
    throw new Error('Method not implemented.');
  }
  updateWaitingQueue(
    uuid: string,
    updateQueue: WaitingQueue,
  ): Promise<WaitingQueue> {
    throw new Error('Method not implemented.');
  }
  deleteWaitingQueue(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async findLessThanId(id: number): Promise<WaitingQueue[]> {
    return await this.find({
      where: { id: LessThan(id) },
    });
  }

  async findByUUIDWithLock(
    manager: EntityManager,
    uuid: string,
  ): Promise<WaitingQueue | null> {
    return await manager.findOne(WaitingQueue, {
      where: { uuid },
      lock: { mode: 'pessimistic_write' }, // 비관적 락 적용
    });
  }

  async findWaitingWithLock(manager: EntityManager): Promise<WaitingQueue[]> {
    return await manager.find(WaitingQueue, {
      where: { status: 'WAITING' },
      lock: { mode: 'pessimistic_write' }, // 비관적 락 적용
    });
  }

  async updateQueueStatus(
    manager: EntityManager,
    queue: WaitingQueue,
    status: 'PROCESSING' | 'EXPIRED',
    activatedAt?: Date,
    expireAt?: Date,
  ): Promise<WaitingQueue> {
    queue.status = status;
    queue.activatedAt = activatedAt || null;
    queue.expireAt = expireAt || null;
    return await manager.save(queue);
  }

  async createWaitingQueue(waitingQueue: WaitingQueue): Promise<WaitingQueue> {
    return await this.save(waitingQueue);
  }
}
