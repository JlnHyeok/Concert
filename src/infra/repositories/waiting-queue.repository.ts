import { Injectable } from '@nestjs/common';
import { WaitingQueue } from 'src/domain/waiting-queue/model/entity/waiting-queue.entity';
import { IWaitingQueueRepository } from 'src/domain/waiting-queue/model/repository/waiting-queue.repository';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class WaitingQueueRepository
  extends Repository<WaitingQueue>
  implements IWaitingQueueRepository
{
  findByUUId(uuid: string): Promise<WaitingQueue | null> {
    throw new Error('Method not implemented.');
  }
  async findAll(): Promise<WaitingQueue[]> {
    return await this.find();
  }

  async findLessThanId(id: number): Promise<WaitingQueue[]> {
    return await this.find({
      where: { id: LessThan(id) },
    });
  }

  async findByUUID(uuid: string): Promise<WaitingQueue | null> {
    return await this.findOne({
      where: { uuid },
    });
  }

  async findByStatus(
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED',
  ): Promise<WaitingQueue[]> {
    return await this.find({
      where: { status },
    });
  }

  async createWaitingQueue(waitingQueue: WaitingQueue): Promise<WaitingQueue> {
    return await this.save(waitingQueue);
  }

  async updateWaitingQueue(
    uuid: string,
    updateQueue: WaitingQueue,
  ): Promise<WaitingQueue> {
    const waitingQueue = await this.findByUUID(uuid);

    if (!waitingQueue) {
      return null;
    }

    Object.assign(waitingQueue, updateQueue);
    return await this.save(waitingQueue);
  }

  async deleteWaitingQueue(id: number): Promise<void> {
    await this.delete(id);
  }
}
