import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { WaitingQueueFacade } from '../../../application/facades/waiting-queue/waiting-queue.facade';

describe('WaitingQueueController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // 실제로 사용할 모듈
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/waiting-queue/issue')
      .expect(201);

    token = response.headers['authorization'];
  });

  afterAll(async () => {
    // 테스트 데이터 정리

    await app.close();
  });

  describe('/waiting-queue/check (GET)', () => {
    it('should return waiting queue info with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .set('authorization', `${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('remainingTime');
      expect(response.body).toHaveProperty('waitingNumber');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 401 if token is missing', async () => {
      await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .expect(401);
    });

    it('should return 401 if token is invalid', async () => {
      const token = 'invalid_jwt_token';

      await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .set('authorization', `${token}`)
        .expect(401);
    });
  });

  describe('/waiting-queue/issue (POST)', () => {
    it('should issue a token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/waiting-queue/issue')
        .expect(201);

      expect(response.headers['authorization']).toBeDefined();
      expect(response.body.message).toBe('Token issued successfully');
    });
  });
});
