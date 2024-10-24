import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { COMMON_ERRORS, JwtAuthGuard } from '../../../common';

describe('ReservationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    for (let i = 0; i < 10; i++) {
      const requess = await request(app.getHttpServer())
        .post('/user/create')
        .send({ userId: i + 1, name: `John Doe ${i + 1}` })
        .expect(HttpStatus.CREATED);
    }
  });
  afterEach(async () => {
    for (let i = 0; i < 10; i++) {
      const requess = await request(app.getHttpServer())
        .delete(`/delete/${i + 1}`)
        .expect(HttpStatus.OK);
    }
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

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe(COMMON_ERRORS.UNAUTHORIZED.message);
    });

    it('should return 400 Bad Request if token is invalid', async () => {
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
    });
  });

  describe('/reservation/payment (POST)', () => {
    it('should return 401 Bad Request if authorization token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/payment')
        .send({
          userId: '1',
          seatId: '1',
        });

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.body.message).toBe(COMMON_ERRORS.UNAUTHORIZED.message);
    });
  });

  // 예약 동시성 처리 테스트
  describe('/reservation/seat', () => {
    it('should handle concurrent reservation requests', async () => {
      const userRequests: Promise<any>[] = [];
      const token: string[] = [];
      let timer: NodeJS.Timeout;
      for (let i = 0; i < 10; i++) {
        const issueToken = request(app.getHttpServer())
          .post('/waiting-queue/issue')
          .expect(201)
          .then((res) => {
            token.push(res.headers['authorization']);
          });

        timer = setTimeout(async () => {
          const requests = request(app.getHttpServer())
            .post('/reservation/seat')
            .set('Authorization', `${token[i]}`) // 유효한 토큰 사용
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
          if (index == 0) {
            expect(response.status).toBe(HttpStatus.CREATED); // 예약이 성공적으로 생성되어야 함
          }
          expect(response.body.userId).toBe(`user${index + 1}`);
        });
      }
    });
  });

  // 결제 동시성 처리 테스트
  describe('/reservation/payment', () => {
    it('should handle concurrent payment requests', async () => {
      const userRequests: Promise<any>[] = [];
      const token: string[] = [];
      let timer: NodeJS.Timeout;
      for (let i = 0; i < 10; i++) {
        const issueToken = request(app.getHttpServer())
          .post('/waiting-queue/issue')
          .expect(201)
          .then((res) => {
            token.push(res.headers['authorization']);
          });

        timer = setTimeout(async () => {
          const requests = request(app.getHttpServer())
            .post('/reservation/payment')
            .set('Authorization', `${token[i]}`) // 유효한 토큰 사용
            .send({
              userId: `user${i + 1}`,
              seatId: '1',
            });
          userRequests.push(requests);
        }, 100);

        clearTimeout(timer);
        const responses = await Promise.all(userRequests);

        // 모든 응답을 확인
        responses.forEach((response, index) => {
          if (index == 0) {
            expect(response.status).toBe(HttpStatus.CREATED); // 결제가 성공적으로 생성되어야 함
          }
          expect(response.body.userId).toBe(`user${index + 1}`);
        });
      }
    });
  });
});
