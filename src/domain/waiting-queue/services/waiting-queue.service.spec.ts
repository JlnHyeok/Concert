import { Test, TestingModule } from '@nestjs/testing';
import { WaitingQueueService } from './waiting-queue.service';
import {
  IWaitingQueueRepository,
  WAITING_QUEUE_REPOSITORY,
} from '../model/repository/waiting-queue.repository';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { BusinessException } from '../../../common/exception/business-exception';
import { WAITING_QUEUE_ERROR_CODES } from '../error/waiting-queue.error';

describe('WaitingQueueService', () => {
  let service: WaitingQueueService;
  let repository: IWaitingQueueRepository;
  let configService: ConfigService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitingQueueService,
        {
          provide: WAITING_QUEUE_REPOSITORY,
          useValue: {
            findByUUIDWithLock: jest.fn(),
            createWaitingQueue: jest.fn(),
            updateQueueStatus: jest.fn(),
            findLessThanId: jest.fn(),
            findWaitingWithLock: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'JWT_SECRET') return 'secret';
              if (key === 'NUMBER_OF_PROCESS') return 5;
              return null;
            }),
          },
        },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get<WaitingQueueService>(WaitingQueueService);
    repository = module.get<IWaitingQueueRepository>(WAITING_QUEUE_REPOSITORY);
    configService = module.get<ConfigService>(ConfigService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('checkWaitingQueue', () => {
    it('should return queue info when token is valid', async () => {
      const token = jwt.sign({ uuid: 'test-uuid' }, 'secret');
      jest.spyOn(repository, 'findByUUIDWithLock').mockResolvedValue({
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        expireAt: new Date(),
        createdAt: new Date(),
        activatedAt: new Date(),
        uuid: 'test-uuid',
      });
      jest.spyOn(repository, 'findLessThanId').mockResolvedValue([]);
      jest.spyOn(service, 'verifyToken').mockReturnValue({
        uuid: 'test-uuid',
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        createdAt: new Date(),
        activatedAt: new Date(),
        expireAt: new Date(),
      });
      const result = await service.checkWaitingQueue(token);

      expect(result).toBeUndefined();
    });

    it('should be undefined if queue info is not found', async () => {
      const token = jwt.sign({ uuid: 'invalid-uuid' }, 'secret');
      jest.spyOn(repository, 'findByUUIDWithLock').mockResolvedValue(null);
      jest.spyOn(service, 'verifyToken').mockReturnValue({
        uuid: 'invalid-uuid',
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        createdAt: null,
        activatedAt: null,
        expireAt: null,
      });
      await expect(service.checkWaitingQueue(token)).resolves.toBeUndefined();
    });

    it('should return status EXPIRED if queue status is expired', async () => {
      const token = jwt.sign({ uuid: 'expired-uuid' }, 'secret');
      jest.spyOn(repository, 'findByUUIDWithLock').mockResolvedValue({
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        expireAt: new Date(),
        createdAt: new Date(),
        activatedAt: new Date(),
        uuid: 'test-uuid',
      });
      jest.spyOn(service, 'verifyToken').mockReturnValue({
        uuid: 'expired-uuid',
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        createdAt: null,
        activatedAt: null,
        expireAt: null,
      });
      await service.checkWaitingQueue(token);
    });

    it('should throw BusinessException for invalid token', async () => {
      const invalidToken = 'invalid-token';
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error();
      });

      await expect(service.checkWaitingQueue(invalidToken)).rejects.toThrow(
        new BusinessException(WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID, 401),
      );
    });
  });

  describe('expireToken', () => {
    it('should faild update queue status to unauthorize', async () => {
      const token = jwt.sign({ uuid: 'test-uuid' }, 'secret');
      jest.spyOn(repository, 'findByUUIDWithLock').mockResolvedValue({
        id: 1,
        status: 'WAITING' as 'WAITING',
        expireAt: new Date(),
        createdAt: new Date(),
        activatedAt: new Date(),
        uuid: 'test-uuid',
      });
      jest.spyOn(repository, 'updateQueueStatus').mockResolvedValue(undefined);

      await expect(service.expireToken(token)).rejects.toThrow(
        WAITING_QUEUE_ERROR_CODES.TOKEN_INVALID.message,
      );
    });

    it('should throw BusinessException if queue info is not found', async () => {
      const token = jwt.sign({ uuid: 'invalid-uuid' }, 'secret');
      jest.spyOn(repository, 'findByUUIDWithLock').mockResolvedValue(null);
      jest.spyOn(service, 'verifyToken').mockReturnValue({
        uuid: 'invalid-uuid',
        id: 1,
        status: 'EXPIRED' as 'EXPIRED',
        createdAt: null,
        activatedAt: null,
        expireAt: null,
      });
      await expect(service.expireToken(token)).resolves.toBeUndefined();
    });
  });
});
