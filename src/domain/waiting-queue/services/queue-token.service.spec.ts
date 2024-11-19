import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { QueueTokenService } from './queue-token.service';
import { BusinessException } from '../../../common';
import { AppModule } from '../../../app.module';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    hget: jest.fn(),
    hgetall: jest.fn(),
    zrange: jest.fn(),
    zrem: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
  }));
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('QueueTokenService', () => {
  let service: QueueTokenService;
  let redisClient: jest.Mocked<Redis>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueueInfo', () => {
    it('should return queue info if uuid exists', async () => {
      redisClient.hgetall.mockResolvedValueOnce({ uuid: 'test-uuid' });

      const result = await service.getQueueInfo('queueKey');
      expect(result).toEqual({ uuid: 'test-uuid' });
      expect(redisClient.hgetall).toHaveBeenCalledWith('queueKey');
    });

    it('should throw BusinessException if uuid does not exist', async () => {
      redisClient.hgetall.mockResolvedValueOnce({});

      await expect(service.getQueueInfo('queueKey')).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('calculateRemainingSlots', () => {
    it('should calculate remaining slots correctly', async () => {
      redisClient.hget.mockResolvedValueOnce('PROCESSING');
      redisClient.hget.mockResolvedValueOnce('WAITING');

      const remainingSlots = await service.calculateRemainingSlots([
        'key1',
        'key2',
      ]);

      expect(remainingSlots).toBe(4); // Assuming NUMBER_OF_PROCESS is 5
    });
  });

  describe('createToken', () => {
    it('should create a JWT token', () => {
      jest.spyOn(jwt, 'verify').mockReturnValue();
      // jwt.sign.mockReturnValue('test-token');

      const token = service.createToken('test-uuid');
      expect(token).toBe('test-token');
      expect(jwt.sign).toHaveBeenCalledWith({ uuid: 'test-uuid' }, 'secret', {
        expiresIn: '5m',
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      jest.spyOn(jwt, 'verify').mockReturnValue();

      const result = service.verifyToken('test-token');
      expect(result).toEqual({ uuid: 'test-uuid' });
      expect(jwt.verify).toHaveBeenCalledWith('test-token', 'secret');
    });

    it('should throw BusinessException if token is invalid', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error();
      });

      expect(() => service.verifyToken('invalid-token')).toThrow(
        BusinessException,
      );
    });
  });

  describe('activateQueueImmediately', () => {
    it('should activate a queue immediately', () => {
      const queueInfo = {};
      service.activateQueueImmediately(queueInfo);

      expect(queueInfo).toHaveProperty('status', 'PROCESSING');
      expect(queueInfo).toHaveProperty('activatedAt');
      expect(queueInfo).toHaveProperty('expireAt');
    });
  });

  describe('removeExpiredProcessingKeys', () => {
    it('should remove expired keys', async () => {
      redisClient.hget.mockResolvedValueOnce('PROCESSING');
      redisClient.hget.mockResolvedValueOnce(
        new Date(Date.now() - 1000).toISOString(),
      );

      await service.removeExpiredProcessingKeys(['key1'], new Date());

      expect(redisClient.zrem).toHaveBeenCalledWith('waitingQueue', 'key1');
      expect(redisClient.hdel).toHaveBeenCalledWith(
        'key1',
        'status',
        'expireAt',
        'activatedAt',
        'uuid',
        'createdAt',
      );
    });
  });

  describe('activateWaitingKeys', () => {
    it('should activate waiting keys', async () => {
      redisClient.zrange.mockResolvedValueOnce(['key1', 'key2']);
      redisClient.hget.mockResolvedValue('WAITING');

      await service.activateWaitingKeys(2, new Date());

      expect(redisClient.hset).toHaveBeenCalledTimes(2);
    });
  });
});
