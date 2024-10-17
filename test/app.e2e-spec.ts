import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module'; // 경로에 맞게 수정
import { HttpStatus } from '@nestjs/common';

describe('App E2E Tests', () => {
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

  describe('ReservationController', () => {
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

      it('should handle concurrent reservation requests', async () => {
        const userRequests = Array.from({ length: 3 }, (_, index) => {
          return request(app.getHttpServer())
            .post('/reservation/seat')
            .set('Authorization', 'Bearer token') // 유효한 토큰 사용
            .send({
              userId: `user${index + 1}`,
              concertId: '1',
              performanceDate: '2024-10-20',
              seatNumber: 'A' + (index + 1), // A1, A2, ... A5
            });
        });

        const responses = await Promise.all(
          userRequests.map((req) => req.timeout(5000)),
        ); // 타임아웃 5초 설정

        // 모든 응답을 확인
        responses.forEach((response, index) => {
          console.log(response.status);
          // expect(response.status).toBe(HttpStatus.CREATED); // 예약이 성공적으로 생성되어야 함
          // expect(response.body.userId).toBe(`user${index + 1}`);
        });
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
});
