import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { COMMON_ERRORS, JwtAuthGuard } from '../../../common';
import { DataSource } from 'typeorm';
import { WaitingQueueService } from '../../../domain/waiting-queue/services/waiting-queue.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationInterceptor } from '../../../common/interceptor/validation-interceptor';

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
          provide: APP_INTERCEPTOR,
          useClass: ValidationInterceptor,
        },
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
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.manager.query(
      'TRUNCATE TABLE "user" RESTART IDENTITY CASCADE',
    );
    await dataSource.manager.query(
      'TRUNCATE TABLE "balance" RESTART IDENTITY CASCADE',
    );
    await dataSource.manager.query(`
      TRUNCATE TABLE "concert" RESTART IDENTITY CASCADE;`);
    await dataSource.manager.query(`
      TRUNCATE TABLE "performance_date" RESTART IDENTITY CASCADE;`);
    await dataSource.manager.query(`
      TRUNCATE TABLE "seat" RESTART IDENTITY CASCADE;`);
    await dataSource.manager.query(`
      TRUNCATE TABLE "reservation" RESTART IDENTITY CASCADE;`);
    await dataSource.manager.query(`
      TRUNCATE TABLE "payment_outbox" RESTART IDENTITY CASCADE;`);
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // 테스트용 유저 데이터 삽입
    for (let i = 0; i < 10; i++) {
      const requess = await request(app.getHttpServer())
        .post('/user/create')
        .send({ userId: i + 1, name: `John Doe ${i + 1}` })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/user/charge')
        .send({
          userId: i + 1,
          point: 100000,
        });
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
    await waitingQueueService.deleteAll();
    await dataSource.manager.query(
      'TRUNCATE TABLE "user" RESTART IDENTITY CASCADE',
    );
    await dataSource.manager.query(
      'TRUNCATE TABLE "balance" RESTART IDENTITY CASCADE',
    );
    await dataSource.manager.query(`
      TRUNCATE TABLE "concert" RESTART IDENTITY CASCADE;`);
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
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/waiting-queue/issue')
          .expect(201)
          .then((res) => {
            token.push(res.headers['authorization']);
          });
        waitingQueueService.updateTokenStatus();
      }

      const userRequest = Array(3)
        .fill(0)
        .map((_, i) => {
          return request(app.getHttpServer())
            .post('/reservation/seat')
            .set('authorization', `${token[i]}`)
            .send({
              userId: i == 0 ? 4 : i + 1,
              concertId: concertId,
              performanceDate: performanceDate,
              seatNumber: 1,
            });
        });
      const responses = await Promise.allSettled(userRequest);

      const user = await dataSource.manager.query(`
        SELECT * FROM "user"`);
      const concert = await dataSource.manager.query(`
        SELECT * FROM "concert"`);
      const performanceDateRes = await dataSource.manager.query(`
        SELECT * FROM "performance_date"`);
      const seat = await dataSource.manager.query(`
        SELECT * FROM "seat"`);
      const reservation = await dataSource.manager.query(`
        SELECT * FROM "reservation"`);

      expect(reservation.length).toBe(1);
      expect(reservation[0].user_id).toBe(4);
      expect(reservation[0].seat_id).toBe(1);
    });
  });

  // 결제 처리 테스트
  describe('/reservation/payment', () => {
    it('should handle payment requests', async () => {
      // const userRequests: Promise<any>[] = [];
      // let timer: NodeJS.Timeout;
      let issuedToken: string;
      await request(app.getHttpServer())
        .post('/waiting-queue/issue')
        .expect(201)
        .then((res) => {
          issuedToken = res.headers['authorization'];
        });

      const reservationRequest = await request(app.getHttpServer())
        .post('/reservation/seat')
        .set('authorization', `${issuedToken}`)
        .send({
          userId: 1,
          concertId: concertId,
          performanceDate: performanceDate,
          seatNumber: 1,
        });

      const payRequest = await request(app.getHttpServer())
        .post('/reservation/payment')
        .set('authorization', `${issuedToken}`)
        .send({
          userId: 1,
          seatId: Number(createdSeatRes.body.id),
        });

      let balance = await dataSource.manager.query(`
        SELECT * FROM "balance"`);
      let userBalance = balance.filter((b) => b.userId === 1)[0].balance;
      let paymentOutbox = await dataSource.manager.query(`
        SELECT * FROM "payment_outbox"`);

      expect(userBalance).toBe('90000');
      expect(paymentOutbox.length).toBe(1);
    });
  });
});
