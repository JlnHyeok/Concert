import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module'; // 실제 AppModule 경로
import { DataSource } from 'typeorm';

describe('ConcertController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let concertId: string;
  let performanceId: string;
  let performanceDate = '2024-10-31';
  let createdSeatRes: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource); // TypeORM DataSource 인스턴스 가져오기

    // ValidationPipe 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // DTO에 정의된 프로퍼티만 허용
        forbidNonWhitelisted: true, // 정의되지 않은 값이 들어오면 예외 발생
        transform: true, // 요청 객체를 자동 변환
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // 테스트용 데이터 삽입
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
    // 테스트 데이터 정리
    await request(app.getHttpServer())
      .delete(`/concert/delete/${concertId}`)
      .expect(200);
  });

  describe('/concert/schedule/:concertId (GET)', () => {
    it('should return the available dates for the test concert', async () => {
      const response = await request(app.getHttpServer())
        .get(`/concert/schedule/${concertId}`)
        .expect(200);

      expect(response.body).toEqual([
        {
          id: performanceId,
          concertId,
          performanceDate: `${new Date(performanceDate).toISOString()}`,
        },
      ]);
    });

    it('should return 400 Bad Request for invalid concertId', async () => {
      await request(app.getHttpServer())
        .get('/concert/schedule/invalid-id')
        .expect(400);
    });
  });

  describe('/concert/seat/:concertId/:performanceDate (GET)', () => {
    it('should return the available seats for the specified date', async () => {
      const response = await request(app.getHttpServer())
        .get(`/concert/seat/${concertId}/${performanceDate}`)
        .expect(200);

      expect(response.body).toEqual([
        {
          ...createdSeatRes.body,
          price: createdSeatRes.body.price.toString(),
          releaseAt: null,
        },
      ]);
    });

    it('should return 400 Bad Request for invalid parameters', async () => {
      await request(app.getHttpServer())
        .get(`/concert/seat/${concertId}/invalid-date`)
        .expect(400);
    });
  });
});
