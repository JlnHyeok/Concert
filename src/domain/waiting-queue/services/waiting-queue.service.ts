import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { BusinessException } from '../../../common/exception/business-exception';
import { WAITING_QUEUE_ERROR_CODES } from '../error/waiting-queue.error';
import { QueueTokenService } from './queue-token.service';

@Injectable()
export class WaitingQueueService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly NUMBER_OF_PROCESS: number;

  constructor(
    private readonly QueueTokenService: QueueTokenService,
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

  // 대기열 상태 확인
  async checkWaitingQueue(token: string): Promise<any> {
    const { uuid } = this.QueueTokenService.verifyToken(token);
    const queueKey = `queue:${uuid}`;
    const queueInfo = await this.QueueTokenService.getQueueInfo(queueKey);

    if (queueInfo.status !== 'WAITING') {
      return this.QueueTokenService.getQueueStatusResponse(queueInfo);
    }

    const waitingNumber =
      await this.QueueTokenService.calculateWaitingNumber(queueKey);
    const remainingTime =
      this.QueueTokenService.calculateRemainingTime(waitingNumber);

    return { waitingNumber, remainingTime, status: 'WAITING' };
  }

  // 토큰 만료
  async expireToken(token: string): Promise<void> {
    const { uuid } = this.QueueTokenService.verifyToken(token);
    const queueKey = `queue:${uuid}`;
    const queueInfo = await this.QueueTokenService.getQueueInfo(queueKey);

    if (queueInfo.status === 'WAITING') {
      await this.redisClient.hset(queueKey, 'status', 'EXPIRED');
    }
  }

  // 토큰 생성
  async generateToken(): Promise<string> {
    const uuid = uuidv4();
    const queueKey = `queue:${uuid}`;
    const queueInfo = {
      uuid,
      createdAt: new Date().toISOString(),
      status: 'WAITING',
      activatedAt: null,
      expireAt: null,
    };

    // 대기열이 바로 처리 가능한 경우
    if (await this.QueueTokenService.canProcessImmediately()) {
      this.QueueTokenService.activateQueueImmediately(queueInfo);
    }

    // 대기열에 추가
    await this.redisClient.hmset(queueKey, queueInfo);
    await this.redisClient.zadd('waitingQueue', Date.now(), queueKey);

    return this.QueueTokenService.createToken(uuid);
  }

  // 주기적으로 대기열 상태 업데이트 => expire_in 옵션이 있으므로 만료처리 필요 없음.
  @Cron('0 */3 * * * *')
  async updateTokenStatus() {
    const now = new Date();
    const processingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    if (processingKeys.length === 0) return;
    await this.QueueTokenService.removeExpiredProcessingKeys(
      processingKeys,
      now,
    );
    const remainingSlots =
      await this.QueueTokenService.calculateRemainingSlots(processingKeys);

    if (remainingSlots > 0) {
      await this.QueueTokenService.activateWaitingKeys(remainingSlots, now);
    }
  }

  async deleteAll() {
    await this.redisClient.flushall();
  }

  async getSizeOfProcessingStatus(): Promise<number> {
    return this.QueueTokenService.getSizeOfProcessingStatus();
  }

  async checkTokenIsProcessing(token: string): Promise<boolean> {
    const { uuid } = this.QueueTokenService.verifyToken(token);
    const queueKey = `queue:${uuid}`;
    const queueInfo = await this.QueueTokenService.getQueueInfo(queueKey);
    if (queueInfo.status !== 'PROCESSING') {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    let expired = new Date(queueInfo.expireAt);
    let parsedExpired = new Date(expired.setHours(expired.getHours() + 9));
    if (parsedExpired.toISOString() < new Date().toISOString()) {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return queueInfo.status === 'PROCESSING';
  }
}

/* 
  ZSet (Sorted Set)
  - Redis 의 자료 구조 중 하나로, 정렬된 집합. (각각의 요소는 score 라는 실수 값으로 연결되어 있으며, 이 score 를 기준으로 정렬)
  - 점수는 주로 timestamp 나 순위와 같은 정렬 기준으로 사용
    - ZADD : ZSet 에 요소를 추가 (key, score, member)
    - ZRANGE : ZSet 에서 특정 범위의 요소를 스코어 순으로 가져옴. 인덱스를 사용하여 범위를 지정할 수 있음. (key, start, stop)
    - ZREM : ZSet 에서 특정 요소를 제거 (key, member)
  Hash
  - Redis 의 자료 구조 중 하나로, key-value 쌍을 저장하는 해시 테이블
*/
