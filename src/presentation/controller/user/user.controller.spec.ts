import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserService } from '../../../domain/user/services/user.service';
import { AppModule } from '../../../app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get<UserService>(UserService); // UserService 주입

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
    await app.close();
  });

  beforeEach(async () => {
    // 테스트 데이터 추가
    await userService.createUser(123, 'John Doe'); // 테스트 사용자 추가
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await userService.deleteUser(123); // 테스트 사용자 삭제
  });

  describe('/user/create (POST)', () => {
    it('201 Created - 새로운 사용자 생성', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/create')
        .send({ userId: 124, name: 'Jane Doe' }) // 다른 사용자 추가
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('balance');

      await userService.deleteUser(124); // 테스트 사용자 삭제
    });

    it('400 Bad Request - 잘못된 요청', async () => {
      await request(app.getHttpServer())
        .post('/user/create')
        .send({ name: 'John Doe' }) // userId 누락
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/user/charge (POST)', () => {
    it('201 Created - 포인트 충전 성공', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: 123, point: 100 })
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        balance: 100, // 충전한 포인트
      });
    });

    it('400 Bad Request - 잘못된 포인트 값', async () => {
      const res = await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: '123', point: -50 }) // 음수 포인트
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/user/point/:userId (GET)', () => {
    it('200 OK - 사용자 포인트 조회 성공', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/point/123')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        balance: '0', // 위의 테스트에서 충전한 포인트
      });
    });

    it('400 Bad Request - 존재하지 않는 사용자', async () => {
      await request(app.getHttpServer())
        .get('/user/point/999') // 존재하지 않는 userId
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // 유저 포인트 충전 동시성 테스트
  describe('Concurrent user point charge', () => {
    it('should handle concurrent user point charge requests', async () => {
      const chargeRequest = Array(3)
        .fill(0)
        .map((_, i) => {
          return request(app.getHttpServer())
            .post('/user/charge')
            .send({ userId: 123, point: 100 })
            .expect(HttpStatus.CREATED);
        });

      const responses = await Promise.allSettled(chargeRequest);

      // 모든 응답을 확인
      responses.forEach((response) => {
        expect(response.status).toBe('fulfilled'); // 포인트 충전이 성공적으로 이루어져야 함
      });

      // 포인트 잔액 확인
      const pointResponse = await request(app.getHttpServer())
        .get('/user/point/123')
        .expect(HttpStatus.OK);

      expect(pointResponse.body).toEqual({
        balance: '300', // 100 * 10
      });
    });
  });

  // 유저 포인트 사용 동시성 테스트
  describe('Concurrent user point use', () => {
    it('should handle concurrent user point use requests', async () => {
      await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: 123, point: 2000 })
        .expect(HttpStatus.CREATED);

      // await request(app.getHttpServer())
      //   .post('/user/use')
      //   .send({ userId: 123, point: 2000 })
      //   .expect(HttpStatus.CREATED);
      const payRequest = Array(5)
        .fill(0)
        .map((_, i) => {
          return request(app.getHttpServer())
            .post('/user/use')
            .send({ userId: 123, point: 100 })
            .expect(HttpStatus.CREATED);
        });

      const responses = await Promise.allSettled(payRequest);

      // 모든 응답을 확인
      responses.forEach((response) => {
        expect(response.status).toBe('fulfilled'); // 포인트 사용이 성공적으로 이루어져야 함
      });

      // 포인트 잔액 확인
      const pointResponse = await request(app.getHttpServer())
        .get('/user/point/123')
        .expect(HttpStatus.OK);

      expect(pointResponse.body).toEqual({
        balance: '1500', // 2000 - 100 * 10
      });
    });
  });
});
