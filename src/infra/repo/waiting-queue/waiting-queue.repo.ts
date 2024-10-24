import { IWaitingQueueRepository } from '../../../domain/waiting-queue/model/repository/waiting-queue.repository';
import { WaitingQueue } from '../../../domain/waiting-queue/model/entity/waiting-queue.entity';
import { EntityManager, LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

export class WaitingQueueRepository implements IWaitingQueueRepository {
  constructor(
    @InjectRepository(WaitingQueue)
    private readonly waitingQueueRepository: Repository<WaitingQueue>,
  ) {}
  async findAll(): Promise<WaitingQueue[]> {
    return await this.waitingQueueRepository.find();
  }
  async findByUUID(uuid: string): Promise<WaitingQueue | null> {
    return await this.waitingQueueRepository.findOne({ where: { uuid } });
  }

  async findByStatus(
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED',
  ): Promise<WaitingQueue[]> {
    return await this.waitingQueueRepository.find({ where: { status } });
  }
  async updateWaitingQueue(
    uuid: string,
    updateQueue: WaitingQueue,
  ): Promise<WaitingQueue> {
    return await this.waitingQueueRepository.save(updateQueue);
  }
  async deleteWaitingQueue(id: number): Promise<void> {
    await this.waitingQueueRepository.delete(id);
    return;
  }

  async findLessThanId(id: number): Promise<WaitingQueue[]> {
    return await this.waitingQueueRepository.find({
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
    try {
      const savedData = this.waitingQueueRepository.create(waitingQueue);
      return await this.waitingQueueRepository.save(savedData);
    } catch (e) {
      console.error('ERROR', e);
    }
  }
}
