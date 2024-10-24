import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module'; // 실제 AppModule 경로
import { DataSource } from 'typeorm';

describe('ConcertController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let concertId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource); // TypeORM DataSource 인스턴스 가져오기
    await app.init();

    // 테스트용 데이터 삽입
    const concertInsertResult = await dataSource.query(`
      INSERT INTO concert (title) VALUES ('Test Concert') RETURNING id;
    `);
    concertId = concertInsertResult[0].id;

    await dataSource.query(`
      INSERT INTO concert_schedule (concert_id, date, available_seats) 
      VALUES (${concertId}, '2024-10-30', 100),
             (${concertId}, '2024-10-31', 50);
    `);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await dataSource.query(
      `DELETE FROM concert_schedule WHERE concert_id = ${concertId}`,
    );
    await dataSource.query(`DELETE FROM concert WHERE id = ${concertId}`);
    await app.close();
  });

  describe('/concert/schedule/:concertId (GET)', () => {
    it('should return the available dates for the test concert', async () => {
      const response = await request(app.getHttpServer())
        .get(`/concert/schedule/${concertId}`)
        .expect(200);

      expect(response.body).toEqual([
        { date: '2024-10-30', availableSeats: 100 },
        { date: '2024-10-31', availableSeats: 50 },
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
      // 공연 좌석 정보 삽입
      await dataSource.query(`
        INSERT INTO concert_seat (concert_id, seat_number, status, date) 
        VALUES (${concertId}, 'A1', 'available', '2024-10-30'),
               (${concertId}, 'A2', 'reserved', '2024-10-30');
      `);

      const response = await request(app.getHttpServer())
        .get(`/concert/seat/${concertId}/2024-10-30`)
        .expect(200);

      expect(response.body).toEqual([
        { seatNumber: 'A1', status: 'available' },
        { seatNumber: 'A2', status: 'reserved' },
      ]);

      // 테스트 종료 후 좌석 정보 삭제
      await dataSource.query(`
        DELETE FROM concert_seat WHERE concert_id = ${concertId} AND date = '2024-10-30';
      `);
    });

    it('should return 400 Bad Request for invalid parameters', async () => {
      await request(app.getHttpServer())
        .get(`/concert/seat/${concertId}/invalid-date`)
        .expect(400);
    });
  });
});
