import { Inject, Injectable } from '@nestjs/common';
import { WaitingQueue } from '../model/entity/waiting-queue.entity';
import { ConfigService } from '@nestjs/config';
import {
  WAITING_QUEUE_REPOSITORY,
  IWaitingQueueRepository,
} from '../model/repository/waiting-queue.repository';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';

@Injectable()
export class WaitingQueueService {
  constructor(
    @Inject(WAITING_QUEUE_REPOSITORY)
    private readonly waitingQueueRepository: IWaitingQueueRepository,
    private readonly configService: ConfigService,
  ) {}

  async checkWaitingQueue(token: string): Promise<{
    waitingNumber: number;
    remainingTime: number;
    status: 'WAITING' | 'PROCESSING' | 'EXPIRED';
    expireAt?: Date;
  }> {
    const decodedToken = this.verifyToken(token);
    const queueInfo = await this.waitingQueueRepository.findByUUID(
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
        expireAt: dayjs(queueInfo.expireAt).toDate(),
      };
    }

    if (queueInfo.status === 'EXPIRED') {
      return {
        waitingNumber: Infinity,
        remainingTime: Infinity,
        status: 'EXPIRED',
      };
    }

    if (queueInfo.status === 'WAITING') {
      const previousWaitingQueues =
        await this.waitingQueueRepository.findLessThanId(queueInfo.id);

      // 대기 순번 계산: 내 ID - 이전 대기열 중 완료된 대기열 수
      const waitingNumber =
        queueInfo.id -
        previousWaitingQueues.filter((queue) => queue.status !== 'WAITING')
          .length;

      const updatePeriod = 5; // 5분
      const numberOfProcess =
        this.configService.get<number>('NUMBER_OF_PROCESS');

      // 예상 대기 시간 = (대기 순번 / 업데이트 주기) * 처리 프로세스 수 (분)
      const remainingTime =
        Number(waitingNumber / updatePeriod) * numberOfProcess;

      return { waitingNumber, remainingTime, status: 'WAITING' };
    }
  }

  async generateToken(): Promise<string> {
    const secretKey = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRED_IN');

    const queueInfo: Partial<WaitingQueue> = {
      uuid: uuidv4(),
      createdAt: new Date(),
      status: 'WAITING',
      expireAt: null,
      activatedAt: null,
    };

    await this.waitingQueueRepository.createWaitingQueue(queueInfo);
    return jwt.sign(queueInfo, secretKey, { expiresIn });
  }

  async expireToken(token: string): Promise<void> {
    const decodedToken = this.verifyToken(token);
    const queueInfo = await this.waitingQueueRepository.findByUUID(
      decodedToken.uuid,
    );

    if (!queueInfo) {
      throw new Error('Queue information not found');
    }

    if (queueInfo.status === 'WAITING') {
      queueInfo.status = 'EXPIRED';
      await this.waitingQueueRepository.updateWaitingQueue(
        queueInfo.uuid,
        queueInfo,
      );
    }
  }

  private verifyToken(token: string): WaitingQueue {
    try {
      const secretKey = this.configService.get<string>('JWT_SECRET');
      return jwt.verify(token, secretKey) as WaitingQueue;
    } catch (e) {
      throw new Error('Token is invalid');
    }
  }

  // 5분마다 실행
  @Cron('0 */5 * * * *')
  async updateTokenStatus() {
    const numberOfProcess = this.configService.get<number>('NUMBER_OF_PROCESS');
    const waitingQueues =
      await this.waitingQueueRepository.findByStatus('WAITING');

    for (let i = 0; i < waitingQueues.length; i++) {
      // 통과 수 제한
      if (i < numberOfProcess) {
        const now = dayjs();
        waitingQueues[i].status = 'PROCESSING';
        waitingQueues[i].activatedAt = now.toDate();
        waitingQueues[i].expireAt = now.add(5, 'minute').toDate();

        // DB UPDATE
        await this.waitingQueueRepository.updateWaitingQueue(
          waitingQueues[i].uuid,
          waitingQueues[i],
        );
      }
    }
  }
}
