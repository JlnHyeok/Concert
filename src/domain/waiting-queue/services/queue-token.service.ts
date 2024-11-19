import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from 'src/common';
import { WAITING_QUEUE_ERROR_CODES } from '../error/waiting-queue.error';
import * as jwt from 'jsonwebtoken';
import Redis from 'ioredis';

@Injectable()
export class QueueTokenService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly NUMBER_OF_PROCESS: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(Redis)
    private readonly redisClient: Redis, // Redis 주입
  ) {
    this.JWT_SECRET = this.configService.get<string>('JWT_SECRET', 'secret');
    this.JWT_EXPIRES_IN = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '5m',
    );
    this.NUMBER_OF_PROCESS = this.configService.get<number>(
      'NUMBER_OF_PROCESS',
      5,
    );
  }

  // **1. Queue 상태 관리**
  activateQueueImmediately(queueInfo: any) {
    queueInfo.status = 'PROCESSING';
    queueInfo.activatedAt = new Date().toISOString();
    queueInfo.expireAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  }

  async removeExpiredProcessingKeys(processingKeys: string[], now: Date) {
    for (const key of processingKeys) {
      const status = await this.redisClient.hget(key, 'status');
      const expireAt = await this.redisClient.hget(key, 'expireAt');
      if (status === 'PROCESSING' && expireAt && new Date(expireAt) < now) {
        await this.redisClient.zrem('waitingQueue', key);
        await this.redisClient.hdel(
          key,
          'status',
          'expireAt',
          'activatedAt',
          'uuid',
          'createdAt',
        );
      }
    }
  }

  async activateWaitingKeys(remainingSlots: number, now: Date) {
    const waitingKeys = await this.redisClient.zrange(
      'waitingQueue',
      0,
      remainingSlots - 1,
    );

    for (const queueKey of waitingKeys) {
      const status = await this.redisClient.hget(queueKey, 'status');
      if (status === 'WAITING') {
        await this.redisClient.hset(
          queueKey,
          'status',
          'PROCESSING',
          'activatedAt',
          now.toISOString(),
          'expireAt',
          new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        );
      }
    }
  }

  // **2. Redis 데이터 접근**
  async getQueueInfo(queueKey: string): Promise<any> {
    const queueInfo = await this.redisClient.hgetall(queueKey);
    if (!queueInfo.uuid) {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.QUEUE_INFO_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return queueInfo;
  }

  async calculateRemainingSlots(processingKeys: string[]): Promise<number> {
    const currentProcessingCount = (
      await Promise.all(
        processingKeys.map(
          async (key) =>
            (await this.redisClient.hget(key, 'status')) === 'PROCESSING',
        ),
      )
    ).filter(Boolean).length;

    return this.NUMBER_OF_PROCESS - currentProcessingCount;
  }

  async calculateWaitingNumber(queueKey: string): Promise<number> {
    const waitingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    let waitingNumber = 1;
    for (const key of waitingKeys) {
      if (key === queueKey) break;
      const status = await this.redisClient.hget(key, 'status');
      if (status === 'WAITING') waitingNumber++;
    }
    return waitingNumber;
  }

  // **3. JWT 토큰 관리**
  createToken(uuid: string): string {
    return jwt.sign({ uuid }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): { uuid: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { uuid: string };
    } catch {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // **4. Queue 상태 계산**
  calculateRemainingTime(waitingNumber: number): number {
    return (
      Math.ceil(waitingNumber / this.NUMBER_OF_PROCESS) * this.NUMBER_OF_PROCESS
    );
  }

  async canProcessImmediately(): Promise<boolean> {
    const processingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    const processingCount = (
      await Promise.all(
        processingKeys.map(
          async (key) =>
            (await this.redisClient.hget(key, 'status')) === 'PROCESSING',
        ),
      )
    ).filter(Boolean).length;
    return processingCount < this.NUMBER_OF_PROCESS;
  }

  // **5. 응답 데이터 생성**
  getQueueStatusResponse(queueInfo: any) {
    const status = queueInfo.status;
    if (status === 'PROCESSING') {
      return {
        waitingNumber: 0,
        remainingTime: 0,
        status,
        expireAt: new Date(queueInfo.expireAt),
      };
    }
    return { waitingNumber: Infinity, remainingTime: Infinity, status };
  }
}
