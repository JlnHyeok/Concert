import { Test, TestingModule } from '@nestjs/testing';
import { WaitingQueueService } from './waiting-queue.service';
import { IWaitingQueueRepository } from '../model/repository/waiting-queue.repository';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

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
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret'; // Secret은 문자열로 반환
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
      ],
    }).compile();

    service = module.get<WaitingQueueService>(WaitingQueueService);
  });

  it('should generate a token', async () => {
    const signSpy = jest.spyOn(jwt, 'sign');
    const uuidSpy = jest.spyOn(uuidv4, 'call').mockReturnValue('test-uuid');
    const queueInfo = {
      id: 1,
      uuid: 'test-uuid',
      createdAt: new Date(),
      status: 'WAITING' as 'WAITING', // 정확한 타입으로 설정
      expireAt: null,
      activatedAt: null,
    };

    mockQueueRepository.createWaitingQueue.mockResolvedValue(queueInfo);

    const token = await service.generateToken();
    expect(signSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'WAITING',
        createdAt: expect.any(Date),
        expireAt: null,
        activatedAt: null,
      }),
      'test-secret',
      { expiresIn: '1h' },
    );

    expect(token).toBeDefined();
    uuidSpy.mockRestore();
  });

  it('should throw an error for invalid token', () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Token is invalid');
    });

    expect(() => service['verifyToken']('invalid-token')).toThrowError(
      'Token is invalid',
    );
  });
});
