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

---

### 4. 테스트 코드

#### 4.1 개요

- 각 테스트 환경을 독립적으로 유지하기 위해, 매 테스트 마다 격리된 Container 를 실행시켜 테스트 코드를 실행하도록 구성.

#### 4.2 테스트 환경

- 테스트 실행 시 각각의 컨테이너 (Concert_Server, Kafka, Redis, PostgreSQL, Concert_Payment_Api_Server) 가 실행됩니다.

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

- 다음과 같이 Docker Image 가 빌드되고 실행됨.
  ![image](https://github.com/user-attachments/assets/d19c8a1a-f0da-4cf7-9333-dcbcde91af28)
  <img width="788" alt="image" src="https://github.com/user-attachments/assets/130b2ce6-abcc-4d47-9d7e-95b70dcbdf01">

#### 4.4 테스트 결과

![image](https://github.com/user-attachments/assets/06f2863f-ff8d-47bf-94d1-785b0e5b4a1f)
