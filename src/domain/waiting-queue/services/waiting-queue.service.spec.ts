import { Test, TestingModule } from '@nestjs/testing';
import { WaitingQueueService } from './waiting-queue.service';
import { ConfigService } from '@nestjs/config';
import { QueueTokenService } from './queue-token.service';
import { Redis } from 'ioredis';
import { BusinessException } from '../../../common/exception/business-exception';
import { WAITING_QUEUE_ERROR_CODES } from '../error/waiting-queue.error';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

describe('WaitingQueueService', () => {
  let waitingQueueservice: WaitingQueueService;
  let queueTokenService: jest.Mocked<QueueTokenService>;
  let redisClient: jest.Mocked<Redis>;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitingQueueService,
        {
          provide: QueueTokenService,
          useValue: {
            verifyToken: jest.fn(),
            getQueueInfo: jest.fn(),
            canProcessImmediately: jest.fn(),
            createToken: jest.fn(),
            calculateWaitingNumber: jest.fn(),
            calculateRemainingTime: jest.fn(),
            activateQueueImmediately: jest.fn(),
            getQueueStatusResponse: jest.fn(),
            removeExpiredProcessingKeys: jest.fn(),
            calculateRemainingSlots: jest.fn(),
            activateWaitingKeys: jest.fn(),
          },
        },
        {
          provide: Redis,
          useValue: {
            hset: jest.fn(),
            hmset: jest.fn(),
            zadd: jest.fn(),
            zrange: jest.fn(),
            flushall: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '5m';
              if (key === 'NUMBER_OF_PROCESS') return 5;
              return null;
            }),
          },
        },
      ],
    }).compile();

    waitingQueueservice = module.get<WaitingQueueService>(WaitingQueueService);
    queueTokenService = module.get(QueueTokenService);
    redisClient = module.get(Redis);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('checkWaitingQueue', () => {
    it('should return waiting status and remaining time if queue is in WAITING state', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({ status: 'WAITING' });
      queueTokenService.calculateWaitingNumber.mockResolvedValue(3);
      queueTokenService.calculateRemainingTime.mockReturnValue(120);

      const result = await waitingQueueservice.checkWaitingQueue(token);

      expect(queueTokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(queueTokenService.getQueueInfo).toHaveBeenCalledWith(
        'queue:test-uuid',
      );
      expect(queueTokenService.calculateWaitingNumber).toHaveBeenCalledWith(
        'queue:test-uuid',
      );
      expect(result).toEqual({
        waitingNumber: 3,
        remainingTime: 120,
        status: 'WAITING',
      });
    });

    it('should return queue status if not in WAITING state', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({ status: 'EXPIRED' });
      queueTokenService.getQueueStatusResponse.mockReturnValue({
        status: 'EXPIRED',
        remainingTime: undefined,
        waitingNumber: undefined,
      });

      const result = await waitingQueueservice.checkWaitingQueue(token);

      expect(queueTokenService.verifyToken).toHaveBeenCalledWith(token);
      expect(queueTokenService.getQueueInfo).toHaveBeenCalledWith(
        'queue:test-uuid',
      );
      expect(queueTokenService.getQueueStatusResponse).toHaveBeenCalled();
      expect(result).toEqual({ status: 'EXPIRED' });
    });

    it('should throw BusinessException if token is invalid', async () => {
      const invalidToken = 'invalid-token';
      queueTokenService.verifyToken.mockImplementation(() => {
        throw new BusinessException(
          WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID,
          401,
        );
      });

      await expect(
        waitingQueueservice.checkWaitingQueue(invalidToken),
      ).rejects.toThrow(
        new BusinessException(WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID, 401),
      );
    });
  });

  describe('expireToken', () => {
    it('should set queue status to EXPIRED if in WAITING state', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({ status: 'WAITING' });

      await waitingQueueservice.expireToken(token);

      expect(redisClient.hset).toHaveBeenCalledWith(
        'queue:test-uuid',
        'status',
        'EXPIRED',
      );
    });

    it('should not update status if queue is not in WAITING state', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({
        status: 'PROCESSING',
      });

      await waitingQueueservice.expireToken(token);

      expect(redisClient.hset).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should create a new token and add it to the queue', async () => {
      queueTokenService.canProcessImmediately.mockResolvedValue(false);
      queueTokenService.createToken.mockReturnValue('new-token');

      const result = await waitingQueueservice.generateToken();
      expect(queueTokenService.createToken).toHaveBeenCalledTimes(1);
      expect(queueTokenService.createToken).toHaveBeenCalledWith(
        expect.any(String),
      );

      expect(redisClient.zadd).toHaveBeenCalledWith(
        'waitingQueue',
        expect.any(Number),
        expect.any(String),
      );
      expect(result).toEqual(expect.any(String));
    });

    it('should activate queue immediately if possible', async () => {
      const uuid = 'test-uuid';
      queueTokenService.createToken.mockReturnValue('new-token');
      queueTokenService.canProcessImmediately.mockResolvedValue(true);

      await waitingQueueservice.generateToken();

      expect(queueTokenService.activateQueueImmediately).toHaveBeenCalled();
    });
  });

  describe('checkTokenIsProcessing', () => {
    it('should return true if token status is PROCESSING', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({
        status: 'PROCESSING',
        expireAt: new Date().toISOString(),
      });

      const result = await waitingQueueservice.checkTokenIsProcessing(token);

      expect(result).toBe(true);
    });

    it('should throw BusinessException if token status is not PROCESSING', async () => {
      const token = 'valid-token';
      queueTokenService.verifyToken.mockReturnValue({ uuid: 'test-uuid' });
      queueTokenService.getQueueInfo.mockResolvedValue({ status: 'WAITING' });

      await expect(
        waitingQueueservice.checkTokenIsProcessing(token),
      ).rejects.toThrow(
        new BusinessException(WAITING_QUEUE_ERROR_CODES.TOKEN_EXPIRED, 401),
      );
    });
  });
});
