import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ConcertController } from './concert.controller';
import { ConcertService } from '../../domain/concert/service/consert.service';

describe('ConcertController (e2e)', () => {
  let app: INestApplication;
  let concertService: ConcertService;

  const mockConcertService = {
    getAvailableDates: jest.fn(),
    getSeats: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ConcertController],
      providers: [{ provide: ConcertService, useValue: mockConcertService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/concert/schedule/:concertId (GET)', () => {
    it('should return 200 and available dates for a concert', async () => {
      mockConcertService.getAvailableDates.mockResolvedValue([
        { concertId: 1, date: '2024-10-20' },
        { concertId: 1, date: '2024-10-21' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/concert/schedule/1') // valid concertId
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([
        { concertId: 1, date: '2024-10-20' },
        { concertId: 1, date: '2024-10-21' },
      ]);
    });

    it('should return 400 if concertId is invalid', async () => {
      await request(app.getHttpServer())
        .get('/concert/schedule/invalid') // invalid concertId
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/concert/seat/:concertId/:performanceDate (GET)', () => {
    it('should return 200 and available seats for a concert on a specific date', async () => {
      mockConcertService.getSeats.mockResolvedValue([
        { concertId: 1, performanceDate: '2024-10-20', seatNumber: 'A1' },
        { concertId: 1, performanceDate: '2024-10-20', seatNumber: 'A2' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/concert/seat/1/2024-10-20') // valid concertId and performanceDate
        .expect(HttpStatus.OK);

      expect(response.body).toEqual([
        { concertId: 1, performanceDate: '2024-10-20', seatNumber: 'A1' },
        { concertId: 1, performanceDate: '2024-10-20', seatNumber: 'A2' },
      ]);
    });

    it('should return 400 if concertId or performanceDate is missing', async () => {
      await request(app.getHttpServer())
        .get('/concert/seat/1/') // concertId is valid but performanceDate is missing
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .get('/concert/seat//2024-10-20') // concertId is missing
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
