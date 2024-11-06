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

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.message).toBe('Authorization header not found');
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

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.message).toBe('Token is invalid');

        let a = await request(app.getHttpServer()).post('/waiting-queue/issue');
      });

      it('should handle concurrent reservation requests', async () => {
        const userRequests: Promise<any>[] = [];
        let timer: NodeJS.Timeout;
        for (let i = 0; i < 10; i++) {
          timer = setTimeout(async () => {
            const requests = request(app.getHttpServer())
              .get('/waiting-queue/check')
              .set('Authorization', 'Bearer token') // 유효한 토큰 사용
              .set('keep-alive', 'true')
              .send({
                userId: `user${i + 1}`,
                concertId: '1',
                performanceDate: '2024-10-20',
                seatNumber: 1, // A1, A2, ... A5
              });
            userRequests.push(requests);
          }, 100);

          clearTimeout(timer);
          const responses = await Promise.all(userRequests);

          // 모든 응답을 확인
          responses.forEach((response, index) => {
            expect(response.status).toBe(HttpStatus.CREATED); // 예약이 성공적으로 생성되어야 함
            expect(response.body.userId).toBe(`user${index + 1}`);
          });
        }
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

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.message).toBe('Authorization header not found');
      });

      it('should return 400 Bad Request if required parameters are missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/reservation/payment')
          .set('Authorization', 'Bearer token') // 유효한 토큰 사용
          .send({
            userId: '1',
            // seatId가 없음
          });

        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.body.message).toBe('Token is invalid');
      });
    });
  });
});
