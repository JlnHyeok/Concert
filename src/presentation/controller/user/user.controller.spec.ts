import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
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

      expect(response.body).toEqual({
        id: 124,
        name: 'Jane Doe',
        balance: 0,
      });
    });

    it('400 Bad Request - 잘못된 요청', async () => {
      await request(app.getHttpServer())
        .post('/user/create')
        .send({ name: 'John Doe' }) // userId 누락
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/user/charge (POST)', () => {
    it('201 Created - 포인트 충전 성공', async () => {
      const response = await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: 123, point: 100 })
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        userId: '123',
        currentPoint: 100,
      });
    });

    it('400 Bad Request - 잘못된 포인트 값', async () => {
      await request(app.getHttpServer())
        .post('/user/charge')
        .send({ userId: '123', point: -50 }) // 음수 포인트
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
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
      const userRequests: Promise<any>[] = [];
      let timer: NodeJS.Timeout;
      for (let i = 0; i < 10; i++) {
        timer = setTimeout(async () => {
          const requests = request(app.getHttpServer())
            .post('/user/charge')
            .send({ userId: 123, point: 100 })
            .set('keep-alive', 'true');
          userRequests.push(requests);
        }, 100);

        clearTimeout(timer);
        const responses = await Promise.all(userRequests);

        // 모든 응답을 확인
        responses.forEach((response, index) => {
          expect(response.status).toBe(HttpStatus.CREATED); // 포인트 충전이 성공적으로 이루어져야 함
          expect(response.body.userId).toBe('123');
        });
      }
    });
  });

  // 유저 포인트 사용 동시성 테스트
  describe('Concurrent user point use', () => {
    it('should handle concurrent user point use requests', async () => {
      const userRequests: Promise<any>[] = [];
      let timer: NodeJS.Timeout;
      for (let i = 0; i < 10; i++) {
        timer = setTimeout(async () => {
          const requests = request(app.getHttpServer())
            .post('/user/use')
            .send({ userId: 123, point: 100 })
            .set('keep-alive', 'true');
          userRequests.push(requests);
        }, 100);

        clearTimeout(timer);
        const responses = await Promise.all(userRequests);

        // 모든 응답을 확인
        responses.forEach((response, index) => {
          expect(response.status).toBe(HttpStatus.CREATED); // 포인트 사용이 성공적으로 이루어져야 함
          expect(response.body.userId).toBe('123');
        });
      }
    });
  });
});
