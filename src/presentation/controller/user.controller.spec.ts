import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { UserController } from './user.controller';
import { UserService } from '../../domain/user/services/user.service';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;

  const mockUserService = {
    chargePoint: jest.fn(),
    getPoint: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user/charge (POST)', () => {
    it('should return 201 and charge points successfully', async () => {
      mockUserService.chargePoint.mockResolvedValue({
        userId: 1,
        point: 100,
      });

      const response = await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: 1, point: 100 })
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ userId: 1, point: 100 });
    });

    it('should return 400 if point value is invalid', async () => {
      await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: 1, point: -10 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/user/point/:userId (GET)', () => {
    it('should return 200 and the user points', async () => {
      mockUserService.getPoint.mockResolvedValue({ userId: 1, point: 50 });

      const response = await request(app.getHttpServer())
        .get('/user/point/1')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({ userId: 1, point: 50 });
    });

    it('should return 400 if userId is invalid', async () => {
      await request(app.getHttpServer())
        .get('/user/point/abc')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
