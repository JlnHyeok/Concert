import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { COMMON_ERRORS, JwtAuthGuard } from '../../../common';
import { DataSource } from 'typeorm';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';

describe('ReservationController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let concertId: string;
  let performanceId: string;
  let performanceDate = '2024-10-31';
  let createdSeatRes: any;
  let waitingQueueService: WaitingQueueService;

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
    // ValidationPipe 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // DTO에 정의된 프로퍼티만 허용
        forbidNonWhitelisted: true, // 정의되지 않은 값이 들어오면 예외 발생
        transform: true, // 요청 객체를 자동 변환
      }),
    );
    await app.init();

    waitingQueueService =
      moduleFixture.get<WaitingQueueService>(WaitingQueueService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 테스트용 유저 데이터 삽입
    for (let i = 0; i < 10; i++) {
      const requess = await request(app.getHttpServer())
        .post('/user/create')
        .send({ userId: i + 1, name: `John Doe ${i + 1}` })
        .expect(HttpStatus.CREATED);
    }
    // 테스트용 콘서트 데이터 삽입
    const createConcertRes = await request(app.getHttpServer())
      .post('/concert/create')
      .send({
        concertName: 'TestConcert',
        location: 'Test Location',
      })
      .expect(201);

    concertId = createConcertRes.body.id;

    const createPerformanceDateRes = await request(app.getHttpServer())
      .post('/concert/schedule/create')
      .send({
        concertId,
        performanceDate: performanceDate,
      });

    performanceId = createPerformanceDateRes.body.id;

    createdSeatRes = await request(app.getHttpServer())
      .post('/concert/seat/create')
      .send({
        concertId,
        performanceDate,
        seatNumber: 1,
        price: 10000,
      });
  });
  afterEach(async () => {
    for (let i = 0; i < 10; i++) {
      const requess = await request(app.getHttpServer())
        .delete(`/user/delete/${i + 1}`)
        .expect(HttpStatus.OK);
    }
    await request(app.getHttpServer()).delete(`/concert/delete/${concertId}`);
  });

  describe('/reservation/seat (POST)', () => {
    it('should return 400 Bad Request if authorization token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/reservation/seat')
        .send({
          userId: '1',
          concertId: '1',
          performanceDate: '2024-10-20',
          seatNumber: 1,
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
          seatNumber: 1,
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
      for (let i = 0; i < 5; i++) {
        const issueToken = request(app.getHttpServer())
          .post('/waiting-queue/issue')
          .expect(201)
          .then((res) => {
            token.push(res.headers['authorization']);
          });
        waitingQueueService.updateTokenStatus();

        timer = setTimeout(async () => {
          const requests = request(app.getHttpServer())
            .post('/reservation/seat')
            .set('Authorization', `${token[i]}`) // 유효한 토큰 사용
            .send({
              userId: `user${i + 1}`,
              concertId: '1',
              performanceDate: '2024-10-20',
              seatNumber: 1,
            });
          userRequests.push(requests);
        }, 100);
      }
      clearTimeout(timer);
      const responses = await Promise.allSettled(userRequests);

      // 모든 응답을 확인
      responses.forEach((response, index) => {
        if (index == 0) {
          expect(response.status).toBe(HttpStatus.CREATED); // 예약이 성공적으로 생성되어야 함
        } else {
          expect(response.status).toBe(`user${index + 1}`);
        }
      });
    });
  });

  // 결제 동시성 처리 테스트
  describe('/reservation/payment', () => {
    it('should handle concurrent payment requests', async () => {
      // const userRequests: Promise<any>[] = [];
      const token: string[] = [];
      // let timer: NodeJS.Timeout;

      for (let i = 0; i < 5; i++) {
        const issueToken = await request(app.getHttpServer())
          .post('/waiting-queue/issue')
          .expect(201)
          .then((res) => {
            token.push(res.headers['authorization']);
          });
        waitingQueueService.updateTokenStatus();
      }

      const payRequest = Array(5)
        .fill(0)
        .map((_, i) => {
          return request(app.getHttpServer())
            .post('/reservation/payment')
            .set('authorization', `${token[i]}`)
            .send({
              userId: Number(`${i + 1}`),
              seatId: Number(createdSeatRes.body.id),
            });
        });

      const responses = await Promise.allSettled(payRequest);

      responses.forEach((response, index) => {
        if (index == 0) {
          expect(response.status).toBe('fulfilled'); // 결제가 성공적으로 생성되어야 함
        }
      });

      // 모든 응답을 확인

      // for (let i = 0; i < 5; i++) {
      //   const issueToken = request(app.getHttpServer())
      //     .post('/waiting-queue/issue')
      //     .expect(201)
      //     .then((res) => {
      //       token.push(res.headers['authorization']);
      //     });
      //   waitingQueueService.updateTokenStatus();

      //   timer = setTimeout(async () => {
      //     const requests = request(app.getHttpServer())
      //       .post('/reservation/payment')
      //       .set('Authorization', `${token[i]}`) // 유효한 토큰 사용
      //       .send({
      //         userId: `user${i + 1}`,
      //         seatId: '1',
      //       });
      //     userRequests.push(requests);
      //   }, 100);
      // }
      // clearTimeout(timer);
      // const responses = await Promise.allSettled(userRequests);

      // // 모든 응답을 확인
      // responses.forEach((response, index) => {
      //   if (index == 0) {
      //     expect(response.status).toBe(HttpStatus.CREATED); // 결제가 성공적으로 생성되어야 함
      //   }
      //   expect(response).toBe(`user${index + 1}`);
      // });
    });
  });
});
