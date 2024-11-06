import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WAITING_QUEUE_REPOSITORY,
  IWaitingQueueRepository,
} from '../model/repository/waiting-queue.repository';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { DataSource } from 'typeorm';
import { WaitingQueue } from '../model/entity/waiting-queue.entity';

@Injectable()
export class WaitingQueueService {
  constructor(
    @Inject(WAITING_QUEUE_REPOSITORY)
    private readonly waitingQueueRepository: IWaitingQueueRepository,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async checkWaitingQueue(token: string): Promise<{
    waitingNumber: number;
    remainingTime: number;
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED';
    expireAt?: Date;
  }> {
    const decodedToken = this.verifyToken(token);

    return await this.dataSource.transaction(async (manager) => {
      const queueInfo = await this.waitingQueueRepository.findByUUIDWithLock(
        manager,
        decodedToken.uuid,
      );

      if (!queueInfo) {
        throw new Error('Queue information not found');
      }

      if (queueInfo.status === 'PROCESSING') {
        return {
          waitingNumber: 0,
          remainingTime: 0,
          status: 'PROCESSING',
          expireAt: queueInfo.expireAt,
        };
      }

      if (queueInfo.status === 'EXPIRED') {
        return {
          waitingNumber: Infinity,
          remainingTime: Infinity,
          status: 'EXPIRED',
        };
      }

      const previousQueues = await this.waitingQueueRepository.findLessThanId(
        queueInfo.id,
      );

      const waitingNumber =
        queueInfo.id -
        previousQueues.filter((q) => q.status !== 'WAITING').length;

      const updatePeriod = 5;
      const numberOfProcess =
        this.configService.get<number>('NUMBER_OF_PROCESS');
      const remainingTime =
        Math.floor(waitingNumber / updatePeriod) * numberOfProcess;

      return { waitingNumber, remainingTime, status: 'WAITING' };
    });
  }

  async expireToken(token: string): Promise<void> {
    const decodedToken = this.verifyToken(token);

    await this.dataSource.transaction(async (manager) => {
      const queueInfo = await this.waitingQueueRepository.findByUUIDWithLock(
        manager,
        decodedToken.uuid,
      );

      if (!queueInfo) {
        throw new Error('Queue information not found');
      }

      if (queueInfo.status === 'WAITING') {
        await this.waitingQueueRepository.updateQueueStatus(
          manager,
          queueInfo,
          'EXPIRED',
        );
      }
    });
  }

  async generateToken(): Promise<string> {
    const secretKey = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRED_IN');

    const queueInfo: Partial<WaitingQueue> = {
      uuid: uuidv4(),
      createdAt: new Date(),
      status: 'WAITING',
    };

    await this.waitingQueueRepository.createWaitingQueue(
      queueInfo as WaitingQueue,
    );
    return jwt.sign(queueInfo, secretKey, { expiresIn });
  }

  @Cron('0 */5 * * * *')
  async updateTokenStatus() {
    const numberOfProcess = this.configService.get<number>('NUMBER_OF_PROCESS');

    await this.dataSource.transaction(async (manager) => {
      const waitingQueues =
        await this.waitingQueueRepository.findWaitingWithLock(manager);
      if (!waitingQueues || waitingQueues.length === 0) {
        throw new BadRequestException('No waiting queues found');
      }
      for (
        let i = 0;
        i < Math.min(numberOfProcess, waitingQueues.length);
        i++
      ) {
        const now = dayjs();
        await this.waitingQueueRepository.updateQueueStatus(
          manager,
          waitingQueues[i],
          'PROCESSING',
          now.toDate(),
          now.add(5, 'minute').toDate(),
        );
      }
    });
  }

  private verifyToken(token: string): WaitingQueue {
    const secretKey = this.configService.get<string>('JWT_SECRET');
    try {
      return jwt.verify(token, secretKey) as WaitingQueue;
    } catch {
      throw new Error('Token is invalid');
    }
  }
}
