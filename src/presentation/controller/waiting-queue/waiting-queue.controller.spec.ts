import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { WaitingQueueFacade } from '../../../application/facades/waiting-queue/waiting-queue.facade';

describe('WaitingQueueController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // 실제로 사용할 모듈
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/waiting-queue/check (GET)', () => {
    it('should return waiting queue info with valid token', async () => {
      const token = 'valid_jwt_token'; // 유효한 JWT 토큰을 설정해야 합니다.

      const response = await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('yourExpectedProperty'); // 응답의 속성 확인
    });

    it('should return 401 if token is missing', async () => {
      await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .expect(401);
    });

    it('should return 400 if token is invalid', async () => {
      const token = 'invalid_jwt_token';

      await request(app.getHttpServer())
        .get('/waiting-queue/check')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
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

    it('should return 500 if token generation fails', async () => {
      jest
        .spyOn(WaitingQueueFacade.prototype, 'issueToken')
        .mockImplementationOnce(() => {
          throw new Error('Token generation failed');
        });

      const response = await request(app.getHttpServer())
        .post('/waiting-queue/issue')
        .expect(500);

      expect(response.body.message).toBe('Token generation failed');
    });
  });
});
