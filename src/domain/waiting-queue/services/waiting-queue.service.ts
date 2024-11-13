import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { Redis } from 'ioredis';
import { BusinessException } from '../../../common/exception/business-exception';
import { WAITING_QUEUE_ERROR_CODES } from '../error/waiting-queue.error';

@Injectable()
export class WaitingQueueService {
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

  // 대기열 상태 확인
  async checkWaitingQueue(token: string): Promise<any> {
    const { uuid } = this.verifyToken(token);
    const queueKey = `queue:${uuid}`;
    const queueInfo = await this.getQueueInfo(queueKey);

    if (queueInfo.status !== 'WAITING') {
      return this.getQueueStatusResponse(queueInfo);
    }

    const waitingNumber = await this.calculateWaitingNumber(queueKey);
    const remainingTime = this.calculateRemainingTime(waitingNumber);

    return { waitingNumber, remainingTime, status: 'WAITING' };
  }

  // 토큰 만료
  async expireToken(token: string): Promise<void> {
    const { uuid } = this.verifyToken(token);
    const queueKey = `queue:${uuid}`;
    const queueInfo = await this.getQueueInfo(queueKey);

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
    if (await this.canProcessImmediately()) {
      this.activateQueueImmediately(queueInfo);
    }

    // 대기열에 추가
    await this.redisClient.hmset(queueKey, queueInfo);
    await this.redisClient.zadd('waitingQueue', Date.now(), queueKey);

    return this.createToken(uuid);
  }

  // 주기적으로 대기열 상태 업데이트
  @Cron('0 */3 * * * *')
  async updateTokenStatus() {
    const now = new Date();
    const processingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    if (processingKeys.length === 0) return;
    await this.removeExpiredProcessingKeys(processingKeys, now);
    const remainingSlots = await this.calculateRemainingSlots(processingKeys);

    if (remainingSlots > 0) {
      await this.activateWaitingKeys(remainingSlots, now);
    }
  }

  async deleteAll() {
    await this.redisClient.flushall();
  }

  //#region private methods
  // 대기열 즉시 활성화
  private activateQueueImmediately(queueInfo: any) {
    queueInfo.status = 'PROCESSING';
    queueInfo.activatedAt = new Date().toISOString();
    queueInfo.expireAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  }

  // 만료된 대기열 제거
  private async removeExpiredProcessingKeys(
    processingKeys: string[],
    now: Date,
  ) {
    for (const key of processingKeys) {
      const status = await this.redisClient.hget(key, 'status');
      const expireAt = await this.redisClient.hget(key, 'expireAt');
      if (status === 'PROCESSING' && expireAt && new Date(expireAt) < now) {
        await this.redisClient.zrem('waitingQueue', key);
        await this.redisClient.hdel(key, 'status', 'expireAt', 'activatedAt');
      }
    }
  }

  // 남은 슬롯 계산
  private async calculateRemainingSlots(
    processingKeys: string[],
  ): Promise<number> {
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

  // 대기열 활성화
  private async activateWaitingKeys(remainingSlots: number, now: Date) {
    // 대기열에서 대기 중인 키 가져오기
    const waitingKeys = await this.redisClient.zrange(
      'waitingQueue',
      0,
      remainingSlots - 1,
    );

    // 대기열 활성화
    for (const queueKey of waitingKeys) {
      const status = await this.redisClient.hget(queueKey, 'status');

      // 대기 중인 경우 활성화
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

  // JWT 토큰 검증
  private verifyToken(token: string): { uuid: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { uuid: string };
    } catch {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // Redis에서 대기열 항목 가져오기
  private async getQueueInfo(queueKey: string): Promise<any> {
    const queueInfo = await this.redisClient.hgetall(queueKey);
    if (!queueInfo.uuid) {
      throw new BusinessException(
        WAITING_QUEUE_ERROR_CODES.QUEUE_INFO_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return queueInfo;
  }
  // 대기 번호 계산
  private async calculateWaitingNumber(queueKey: string): Promise<number> {
    const waitingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    let waitingNumber = 1;
    for (const key of waitingKeys) {
      if (key === queueKey) break;
      const status = await this.redisClient.hget(key, 'status');
      if (status === 'WAITING') waitingNumber++;
    }
    return waitingNumber;
  }

  // 남은 시간 계산
  private calculateRemainingTime(waitingNumber: number): number {
    return (
      Math.ceil(waitingNumber / this.NUMBER_OF_PROCESS) * this.NUMBER_OF_PROCESS
    );
  }

  // Queue 상태 응답
  private getQueueStatusResponse(queueInfo: any) {
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

  // JWT 토큰 생성
  private createToken(uuid: string): string {
    return jwt.sign({ uuid }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  // 대기열 처리 가능 여부 확인
  private async canProcessImmediately(): Promise<boolean> {
    const processingKeys = await this.redisClient.zrange('waitingQueue', 0, -1);
    const processingCount =
      // TODO: 대용량일 떄 고려
      (
        await Promise.all(
          processingKeys.map(
            async (key) =>
              (await this.redisClient.hget(key, 'status')) === 'PROCESSING',
          ),
        )
      ).filter(Boolean).length;
    return processingCount < this.NUMBER_OF_PROCESS;
  }
  //#endregion
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
