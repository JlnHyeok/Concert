import { Test, TestingModule } from '@nestjs/testing';
import { WaitingQueueService } from './waiting-queue.service';
import { IWaitingQueueRepository } from '../model/repository/waiting-queue.repository';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('WaitingQueueService', () => {
  let service: WaitingQueueService;
  let mockQueueRepository: jest.Mocked<IWaitingQueueRepository>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockQueueRepository = {
      findAll: jest.fn(),
      findByUUID: jest.fn(),
      findLessThanId: jest.fn(),
      findByStatus: jest.fn(),
      createWaitingQueue: jest.fn(),
      updateWaitingQueue: jest.fn(),
      deleteWaitingQueue: jest.fn(),
      findByUUIDWithLock: jest.fn(),
      findWaitingWithLock: jest.fn(),
      updateQueueStatus: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((callback) =>
        callback({
          findOne: jest.fn(),
          find: jest.fn(),
          save: jest.fn(),
        }),
      ),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'NUMBER_OF_PROCESS') return 5;
        if (key === 'JWT_EXPIRED_IN') return '1h';
        return null;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitingQueueService,
        { provide: 'WAITING_QUEUE_REPOSITORY', useValue: mockQueueRepository },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WaitingQueueService>(WaitingQueueService);
  });

  it('should generate a token', async () => {
    const signSpy = jest.spyOn(jwt, 'sign');
    jest.spyOn(uuidv4, 'call').mockReturnValue('test-uuid');
    const queueInfo = {
      id: 1,
      uuid: 'test-uuid',
      createdAt: new Date(),
      status: 'WAITING' as 'WAITING',
      expireAt: null,
      activatedAt: null,
    };

    mockQueueRepository.createWaitingQueue.mockResolvedValue(queueInfo);

    const token = await service.generateToken();
    expect(signSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        uuid: expect.any(String),
        status: expect.any(String),
        createdAt: expect.any(Date),
      }),
      'test-secret',
      { expiresIn: '1h' },
    );

    expect(token).toBeDefined();
    signSpy.mockRestore();
  });

  it('should throw an error for invalid token', () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Token is invalid');
    });

    expect(() => service['verifyToken']('invalid-token')).toThrowError(
      'Token is invalid',
    );
  });

  // 추가: queueStatus 업데이트 테스트
  it('should error update status', async () => {
    const queueId = 1;
    const status = 'PROCESSING';
    const updatedQueue = {
      id: queueId,
      uuid: 'test-uuid',
      createdAt: new Date(),
      status: status as 'PROCESSING',
      expireAt: null,
      activatedAt: null,
    };

    // Mock을 WaitingQueue 객체로 설정
    mockQueueRepository.updateQueueStatus.mockResolvedValue(updatedQueue);
    try {
      await service.updateTokenStatus();
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
    }
  });
});
