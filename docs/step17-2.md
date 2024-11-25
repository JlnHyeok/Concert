# NestJs - Kafka 연동 및 테스트 코드

## 0. Kafka 적용 위치

- 예약된 좌석 결제 시, 실제 결제 처리는 외부 API (PAYMENT_API_SERVER) 에서 이루어지므로 Reservation 의 payment API 에서 사용하기로 결정.

## 1. KAFKA MODULE SETTING & INJECTION

#### kafka.ts

```ts
export const SET_KAFKA_OPTION: (url: string, port: string) => KafkaOptions = (
  url: string,
  port: string,
) => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'my-kafka-client',
        brokers: [`${url}:${port}`],
        retry: {
          retries: 2,
        },
      },
      consumer: {
        allowAutoTopicCreation: true,
        groupId: 'my-kafka-consumer',
        retry: {
          retries: 2,
        },
      },
    },
  };
};
```

---

#### app.module.ts

```ts
ClientsModule.registerAsync({
  isGlobal: true,

  clients: [
    {
      inject: [ConfigService],
      name: 'KAFKA_CLIENT',
      useFactory: async (
        configService: ConfigService,
      ): Promise<KafkaOptions> => {
        const url = configService.get<string>('KAFKA_URL', 'localhost');
        const port = configService.get<string>('KAFKA_PORT', '9092');

        return {
          ...SET_KAFKA_OPTION(url, port),
        };
      },
    },
  ],
}),
```

---

#### main.ts

```ts
// Kafka 설정
const configService = app.get(ConfigService);
const kafkaUrl = configService.get<string>('KAFKA_URL', 'localhost');
const kafkaPort = configService.get<string>('KAFKA_PORT', '9092');

app.connectMicroservice<MicroserviceOptions>(
  SET_KAFKA_OPTION(kafkaUrl, kafkaPort),
);

await app.startAllMicroservices();
```

---

## 2. USE KAFKA (CONSUMER)

- Presentation Layer 의 Reservation Controller 에서 사용
- @MessagePattern 으로 Topic 구독
  - payment: payment 이벤트 발행 보장을 위해 사용 (paymentOutbox status 업데이트)
  - payment.success: payment 성공 이벤트 수신을 위해 사용 (payment 이벤트 후속처리)
  - payment.fail: payment 실패 이벤트 수신을 위해 사용 (payment 이벤트 실패 시, 보상 트랜잭션 실행)

```ts
@MessagePattern('payment')
  async paymentReply(data: PaymentOutboxRequestCommonDto) {
    const { eventId } = data;
    console.log('payment received Execute', data);
    this.reservationFacade.InvokePaymentReply(
      eventId,
      PaymentOutboxStatus.PUBLISHED,
    );
  }

  @MessagePattern('payment.success')
  async paymentSuccess(data: PaymentOutboxRequestCommonDto) {
    const { eventId } = data;
    console.log('paymentSuccess Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentSucess({
      eventId,
      status: PaymentOutboxStatus.SUCCESS,
    });
    return data;
  }

  @MessagePattern('payment.fail')
  async paymentFail(data: PaymentOutboxRequestCommonDto) {
    const { eventId } = data;
    console.log('paymentFail Execute', 'data : ', data);
    this.reservationFacade.InvokePaymentFail({
      eventId: eventId,
    });
    return data;
  }
```

---

### 3. USE KAFKA (PRODUCER)

- Application Layer 의 Reservation Facade 의 createPayment 에서 사용
- this.kafkaClient.emit() 으로 이벤트 발행 (수신을 대기하지 않고 보내고 땡 처리)

```ts
async createPayment(
    token: string,
    userId: number,
    seatId: number,
  ): Promise<void> {
    let seat: Seat;
    let reservation: Reservation;

    console.log('createPayment Execute');
    await this.entityManager.transaction(async (manager) => {
      // 1. 좌석 상태 확인
      seat = await this.concertService.checkSeatStatusBySeatId(
        seatId,
        'HOLD',
        manager,
      );
      // 2. 좌석 상태 변경
      seat.status = 'RESERVED';
      await this.concertService.updateSeat(seat.id, seat, manager);

      // 3. 예약 확인
      reservation =
        await this.reservationService.getReservationByUserIdAndSeatId(
          userId,
          seatId,
          manager,
        );

      // 4. 유저 포인트 사용
      await this.userService.usePoint(userId, seat.price, manager);

      // SAVE META DATA
      const metadata: IPaymentOutboxMetadata = {
        userId: userId,
        token: token,
        price: seat.price,
        reservationId: reservation.id,
        seatId: seat.id,
      };

      // 5. 결제 이벤트 Outbox Data 저장
      console.log('createPaymentOutbox Execute');
      const paymentOutbox = await this.reservationService.createPaymentOutbox(
        metadata,
        manager,
      );

      console.log('emit payment event');

      // 6. 결제 이벤트 발행
      this.kafkaClient
        .emit('payment', {
          key: `payment_reservation_${reservation.id}`,
          value: {
            eventId: paymentOutbox.id,
            // metadata,
          },
        })
        .pipe(timeout(5000));
    });

    return;
  }
```

### 결제 요청 테스트
- POSTMAN
<img width="844" alt="image" src="https://github.com/user-attachments/assets/2d9dffcc-9a7f-4b7f-8b79-3df83ca7685c">

- RESPONSE
<img width="595" alt="image" src="https://github.com/user-attachments/assets/03054d77-4e5c-4699-b38f-b98e52bd3760">

- PAYMENT OUTBOX TABLE
<img width="1326" alt="image" src="https://github.com/user-attachments/assets/2c464cf5-4dac-4965-895e-9cdbd5e291c3">


---

### 4. 테스트 코드

#### 4.1 개요

- 각 테스트 환경을 독립적으로 유지하기 위해, 매 테스트 마다 격리된 Container 를 실행시켜 테스트 코드를 실행하도록 구성.
- 단위 테스트 : 각 service.spec.ts, facade.spec.ts
- 통합 테스트 : 각 controller.spec.ts

#### 4.2 테스트 환경

- 테스트 실행 시 각각의 컨테이너 (Concert_Server 를 제외한 Kafka, Redis, PostgreSQL, Concert_Payment_Api_Server) 가 실행됩니다.

```plaintext
           +-------------+
           |  PostgreSQL |
           +------+------+
                  |
                  |
           +------v------+
           |    Redis    |
           +------+------+
                  |
                  +
                  |
           +------v------+                         +-------v-------+
           | Concert     |    +-------v------+     | Concert       |
           | Server      |<---|    KAFKA     | --->| Payment API   |
           +-------------+    +--------------+     +---------------+
```

#### 4.3 테스트 실행

- 아래 명령어로 실행.

```bash
npm run test:docker
```

- 다음과 같이 Docker Image 가 빌드되고 실행되며 테스트 종료 후 Clear 됨.
  1. Docker Image Build
  ![image](https://github.com/user-attachments/assets/d19c8a1a-f0da-4cf7-9333-dcbcde91af28)

  2. Docker Run
  <img width="788" alt="image" src="https://github.com/user-attachments/assets/130b2ce6-abcc-4d47-9d7e-95b70dcbdf01">
  
  3. Docker Container & Image Clear
  <img width="464" alt="image" src="https://github.com/user-attachments/assets/0dc08a16-201b-432d-9dd3-9054bf6cf387">


#### 4.4 테스트 결과
<img width="544" alt="image" src="https://github.com/user-attachments/assets/c9affcf7-eb54-4a9a-8820-67ad9f5d20b0">

### 5. 서비스 실행
- 서비스 실행 시, 각각의 컨테이너 (Concert_Server, Kafka, Redis, PostgreSQL, Concert_Payment_Api_Server) 가 실행됩니다.
- 아래 명령어로 실행.
```bash
npm run start:docker
```
<img width="791" alt="image" src="https://github.com/user-attachments/assets/a03d60f1-8908-421f-aac4-de084c348b8c">

### 6. [SUB] 테스트 및 서비스 실행 Script
#### 6.1 테스트 SCRIPT
##### test.setup.sh
```bash
#!/bin/bash

# KAFKA SETUP
docker compose -f ./docker/kafka/docker-compose.test.yml up -d

# BUILD AND RUN
docker build -t concert_test_postgres -f ./docker/postgres/Dockerfile  .
docker build -t concert_test_redis -f ./docker/redis/Dockerfile .
docker build -t concert_test_payment_api -f ./docker/payment_server/Dockerfile ./docker/payment_server

docker run -d --restart always --name Concert_test_postgres -p 5555:5432  --network kafka_test_network concert_test_postgres
docker run -d --restart always --name Concert_test_redis -p 6666:6379  --network kafka_test_network -e ALLOW_EMPTY_PASSWORD=yes concert_test_redis
docker run -d --restart always --name Concert_test_payment_api -p 4444:4000  --network kafka_test_network -e NODE_ENV=test concert_test_payment_api

sleep 5

# KAFKA TOPICS
docker exec -it Kafka00ServiceTest \
kafka-topics.sh --create \
--topic payment.success \
--bootstrap-server Kafka00ServiceTest:9092,Kafka01ServiceTest:9092,Kafka02ServiceTest:9092

docker exec -it Kafka00ServiceTest \
kafka-topics.sh --create \
--topic payment.fail \
--bootstrap-server Kafka00ServiceTest:9092,Kafka01ServiceTest:9092,Kafka02ServiceTest:9092
```

##### test.clear.sh
```bash
#!/bin/bash

# KAFKA CLEAR
docker compose -f ./docker/kafka/docker-compose.test.yml down

# CONTAINER CLEAR
docker rm -f Concert_test_postgres
docker rm -f Concert_test_redis
docker rm -f Concert_test_payment_api

# IMAGE CLEAR
docker rmi concert_test_postgres
docker rmi concert_test_redis
docker rmi concert_test_payment_api

# VOLUME CLEAR
docker volume rm $(docker volume ls -qf dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)

# NETWORK CLEAR
docker network rm concert_test_network
docker network rm kafka_test_network
```
##### .env.test
```bash
# DB CONFIG
DB_HOST=localhost
DB_PORT=5555
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=concert
DB_SYNC=true
DB_LOGGING=true

# JWT CONFIG
JWT_SECRET=SeCReT_kEY
JWT_EXPIRES_IN=5m

NUMBER_OF_PROCESS=5

# REDIS CONFIG
REDIS_HOST=localhost
REDIS_PORT=6666
CACHE_TTL=180000
CACHE_MAX=1000

# KAFKA CONFIG
KAFKA_URL=localhost
KAFKA_PORT=11111
KAFKAJS_NO_PARTITIONER_WARNING=1
```

##### npm run test:docker
```bash
"test:docker": "bash ./docker/test.setup.sh && NODE_ENV=test jest --forceExit && bash ./docker/test.clear.sh",
```
---
#### 6.2 서비스 SCRIPT

##### build-and-run.sh
```bash
#!/bin/bash
docker compose -f ./docker/kafka/docker-compose.yml up -d

docker build -t concert_postgres -f ./docker/postgres/Dockerfile  .
docker build -t concert_redis -f ./docker/redis/Dockerfile .
docker build -t concert_payment_api -f ./docker/payment_server/Dockerfile ./docker/payment_server
docker build -t concert_main_server .

docker run -d --restart always --name Concert_postgres -p 5432:5432 --network kafka_local_network concert_postgres
docker run -d --restart always --name Concert_redis -p 6379:6379 --network kafka_local_network -e ALLOW_EMPTY_PASSWORD=yes concert_redis
docker run -d --restart always --name Concert_payment_api -p 4000:4000 --network kafka_local_network concert_payment_api
docker run -d --restart always --name Concert_main -p 3000:3000 -v ./.env.prod:/was/.env --network kafka_local_network concert_main_server
```

##### .env.prod
```bash
# DB CONFIG
DB_HOST=Concert_postgres # WHEN BUILD TO DOCKER IMAGE
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=concert
DB_SYNC=true
DB_LOGGING=true

# JWT CONFIG
JWT_SECRET=SeCReT_kEY
JWT_EXPIRES_IN=5m

NUMBER_OF_PROCESS=5

# REDIS CONFIG
REDIS_HOST=Concert_redis # WHEN BUILD TO DOCKER IMAGE
REDIS_PORT=6379
CACHE_TTL=180000
CACHE_MAX=1000

# KAFKA CONFIG
KAFKA_URL=Kafka00Service
KAFKA_PORT=9092 # WHEN BUILD TO DOCKER IMAGE
KAFKAJS_NO_PARTITIONER_WARNING=1
```

##### npm run start:docker
```bash
"start:docker": "NODE_ENV=production npm run build && bash ./docker/build-and-run.sh"
```
