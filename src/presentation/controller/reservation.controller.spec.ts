import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from '../../app.module';

describe('ReservationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/reservation/seat (POST)', () => {
    it('should return 400 Bad Request if authorization token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/seat')
        .send({
          userId: '1',
          concertId: '1',
          performanceDate: '2024-10-20',
          seatNumber: 'A1',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe('Missing authorization token');
    });

    it('should return 400 Bad Request if required parameters are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/seat')
        .set('Authorization', 'Bearer token') // 유효한 토큰 사용
        .send({
          userId: '1',
          concertId: '1',
          performanceDate: '2024-10-20',
          // seatNumber가 없음
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe('Missing required parameters');
    });
  });

  describe('/reservation/payment (POST)', () => {
    it('should return 400 Bad Request if authorization token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/payment')
        .send({
          userId: '1',
          seatId: '1',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe('Missing authorization token');
    });

    it('should return 400 Bad Request if required parameters are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/payment')
        .set('Authorization', 'Bearer token') // 유효한 토큰 사용
        .send({
          userId: '1',
          // seatId가 없음
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toBe('Missing required parameters');
    });
  });
});
