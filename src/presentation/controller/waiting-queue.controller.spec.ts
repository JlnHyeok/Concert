import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { WaitingQueueService } from '../../domain/waiting-queue/services/waiting-queue.service';
import { WaitingQueueController } from './waiting-queue.controller';

describe('WaitingQueueController (e2e)', () => {
  let app: INestApplication;
  let waitingQueueService: WaitingQueueService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [WaitingQueueController],
      providers: [
        {
          provide: WaitingQueueService,
          useValue: {
            checkWaitingQueue: jest.fn(),
            generateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    waitingQueueService =
      moduleFixture.get<WaitingQueueService>(WaitingQueueService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/waiting-queue/check (GET)', () => {
    it('should return the waiting queue status when given a valid token', async () => {
      const mockResponse = {
        status: 'WAITING' as 'WAITING',
        waitingNumber: 1,
        remainingTime: 10,
      };
      jest
        .spyOn(waitingQueueService, 'checkWaitingQueue')
        .mockResolvedValue(mockResponse);

      const token = 'valid-token';
      const response = await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 400 Bad Request if the token is missing', async () => {
      await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/waiting-queue/issue (POST)', () => {
    it('should issue a new token successfully', async () => {
      const mockToken = 'new-token';
      jest
        .spyOn(waitingQueueService, 'generateToken')
        .mockResolvedValue(mockToken);

      const response = await request(app.getHttpServer())
        .post('/waiting-queue/issue')
        .expect(HttpStatus.CREATED);

      expect(response.headers['authorization']).toBe(`Bearer ${mockToken}`);
      expect(response.body).toEqual({ message: 'Token issued successfully' });
    });

    it('should return 400 Bad Request if token issuance fails', async () => {
      jest
        .spyOn(waitingQueueService, 'generateToken')
        .mockRejectedValue(new Error());

      await request(app.getHttpServer())
        .post('/waiting-queue/issue')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
