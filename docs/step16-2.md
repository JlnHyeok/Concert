# 서비스 확장에 대한 설계 보고서

## 1. 서론

### 1.1. 시스템 개요

현재 주요 구현 시스템은 **예약 서비스**, **결제 서비스**, **대기열 관리 서비스**, **좌석 상태 관리 서비스** 등의 여러 기능을 포함하고 있으며, 각 기능은 독립적인 서비스로 분리되어 있습니다. 이 시스템은 유저가 예약하고 결제하는 과정에서 다양한 서비스들이 조합되어 작업을 수행합니다.

### 1.2. 목적

본 문서는 시스템의 트랜잭션 범위를 분석하고, 서비스 분리에 따른 트랜잭션 처리의 한계와 이를 해결할 수 있는 방안을 제시합니다.

---

## 2. 트랜잭션 범위 분석

### 2.1. 트랜잭션의 정의

트랜잭션은 여러 데이터베이스 작업이 하나의 단위로 묶여서 처리되는 방식으로, **원자성(Atomicity)**, **일관성(Consistency)**, **격리성(Isolation)**, **지속성(Durability)**의 특성을 가집니다.

### 2.2. 현재 시스템의 트랜잭션 범위

현재 주요 트랜잭션은 `ReservationFacade` 의 **예약 생성 (CreateReservation)** 시 수행됩니다.

#### 1. 예약 생성 (`createReservation`):

1. 대기열 서비스에서 토큰이 처리 중인지 확인.
2. 좌석 상태 확인 후 업데이트 (Transaction).
3. 예약 생성.
4. 예약이 완료되면 이벤트 발생. (후속 작업)

```ts
async createReservation({
    token,
    userId,
    concertId,
    performanceDate,
    seatNumber,
  }: {
    token: string;
    userId: number;
    concertId: number;
    performanceDate: Date;
    seatNumber: number;
  }) {
    await this.waitingQueueService.checkTokenIsProcessing(token);

    // Transaction
    const seat = await this.concertService.checkAndUpdateSeatStatus(
      concertId,
      performanceDate,
      seatNumber,
      'AVAILABLE',
    );

    const reservation = this.reservationService.createReservation(
      userId,
      seat.id,
    );

    // RESERVATION COMPLETED EVENT
    this.eventEmitter.emit(RESERVATION_EVENT.RESERVATION_COMPLETED, {
      reservation,
    });

    return reservation;
    //#endregion
  }
```

#### 2. 결제 처리 (`createPayment`):

1. 대기열에서 토큰 확인.
2. 좌석 상태를 체크.
3. 외부 서비스 호출하여 결제 처리.
4. 결제 처리 후 좌석 상태 업데이트 및 결제 정보 DB 저장.
5. 결제 완료 이벤트 발생 (후속 작업).

```ts
async createPayment(token: string, userId: number, seatId: number) {
    // await this.checkActivatedToken(token);
    //#region 1. CHECK TOKEN
    await this.waitingQueueService.checkTokenIsProcessing(token);
    //#endregion

    //#region 2. CHECK SEAT AND RESERVATION
    const seat = await this.concertService.checkSeatStatusBySeatId(
      seatId,
      'HOLD',
    );

    const reservation =
      await this.reservationService.getReservationByUserIdAndSeatId(
        userId,
        seatId,
      );
    //#endregion

    // 3. 외부 서비스 호출
    try {
      this.eventEmitter.emit(RESERVATION_EVENT.PAYMENT_EXTERNAL_INVOKE, {
        userId,
        token,
        price: seat.price,
      });
    } catch (e) {
      throw new BusinessException(COMMON_ERRORS.EXTERNAL_PAYMENT_SERVICE_ERROR);
    }

    seat.status = 'RESERVED';
    await this.concertService.updateSeat(seat.id, seat);

    // 4. DB UPDATE
    const payment = await this.reservationService.createPayment(
      reservation.id,
      seat.price,
    );

    // PAYMENT COMPLETED EVENT
    this.eventEmitter.emit(RESERVATION_EVENT.PAYMENT_COMPLETED, {
      reservation: reservation,
      price: seat.price,
    });

    // 5. 대기열 토큰 만료
    this.waitingQueueService.expireToken(token);

    return payment;
  }
```

---

## 3. 서비스 분리 및 트랜잭션 처리의 한계

### 3.1. 서비스 분리 방안

현재 시스템은 여러 서비스가 서로 긴밀히 연관되어 있습니다. 서비스가 확장되면 각 서비스는 독립적으로 처리되며, 예를 들어 **예약 서비스**, **결제 서비스**, **대기열 관리 서비스** 등으로 분리될 수 있습니다.

### 3.2. 분리에 따른 트랜잭션 처리의 한계

서비스가 분리되면 **분산 트랜잭션**을 관리해야 하는 문제가 발생합니다. 예를 들어, 하나의 서비스에서 실패하면 다른 서비스들에서도 트랜잭션을 롤백해야 하는데, 이 과정에서 다음과 같은 문제가 발생할 수 있습니다:

- **성능 저하**: 분산 트랜잭션은 네트워크 지연과 서비스 간의 통신 비용을 증가시킬 수 있습니다.
- **일관성 유지**: 각 서비스가 독립적으로 동작하면 데이터 일관성을 유지하는 데 어려움이 있습니다.
- **트랜잭션 롤백**: 하나의 서비스에서 실패가 발생하면 전체 작업을 롤백해야 하므로, 트랜잭션 관리가 복잡해집니다.

### 3.3. 해결 방안

1. **SAGA 패턴(SAGA Pattern)**:

   - **SAGA**는 분산 트랜잭션을 처리하는 데 유용한 패턴입니다. 각 서비스는 로컬 트랜잭션을 실행하고, 다른 서비스에서 문제가 발생할 경우 보상 트랜잭션을 실행하여 일관성을 유지합니다.
   - 예를 들어, 예약 서비스에서 예약이 생성되면, 결제 서비스에서 결제 처리가 실패할 경우 예약 서비스에서 예약을 취소하는 방식입니다.

2. **이벤트 기반 아키텍처(Event-Driven Architecture)**:

   - 각 서비스는 **이벤트**를 발행하고 구독하는 방식으로, 서비스 간의 결합도를 낮추고 비동기적으로 트랜잭션을 처리할 수 있습니다.
   - 예를 들어, 결제 서비스가 결제 완료 이벤트를 발행하고, 예약 서비스는 이를 구독하여 예약 상태를 업데이트하는 방식입니다.

3. **분산 트랜잭션 관리 도구**:
   - 분산 트랜잭션을 처리하기 위해 **2단계 커밋(2PC)**을 사용할 수 있습니다. 하지만 성능 저하가 발생할 수 있으므로, 대신 SAGA 패턴과 같은 비동기적이고 보상 가능한 방식이 더 적합합니다.

---

## 4. 트랜잭션 처리 개선을 위한 서비스 설계

서비스가 분리될 경우, **트랜잭션 처리**를 개선하기 위해 다음과 같은 설계를 고려할 수 있습니다:

1. **트랜잭션 관리**: 각 서비스가 독립적인 트랜잭션을 관리하되, 실패 시 롤백할 수 있는 메커니즘을 도입합니다.

   - 예: **SAGA 패턴**을 통해 각 서비스에서 트랜잭션을 처리하고, 문제가 발생하면 보상 트랜잭션을 통해 일관성을 유지합니다.

2. **이벤트 기반 트랜잭션 처리**:

   - 예약 완료, 결제 완료 등의 중요한 작업에 대해 이벤트를 발행하고, 다른 서비스는 이를 구독하여 상태를 업데이트합니다.
   - 예: `PaymentService`는 `PaymentCompleted` 이벤트를 발행하고, `ReservationService`는 이를 구독하여 예약 상태를 업데이트합니다.

3. **이벤트 저장소**:

   - 이벤트 저장소를 두어, 각 서비스에서 발생한 이벤트를 저장하고 이를 다른 서비스가 읽어들이도록 하는 방법입니다. 이벤트의 순서를 보장할 수 있고, 시스템 장애 발생 시에도 데이터를 복구할 수 있습니다.

4. **트랜잭션 확장성 고려**:
   - 서비스 분리 후에는 트랜잭션 범위가 넓어지므로 **분산 트랜잭션 처리** 방안을 충분히 고려하고, 시스템이 커짐에 따라 성능을 고려하여 트랜잭션 처리 방법을 개선해야 합니다.

---

## 5. 결론

서비스의 확장성에 따라 트랜잭션 범위와 처리 방식은 매우 중요한 요소입니다. 서비스가 독립적으로 분리될 경우, 각 서비스의 트랜잭션을 독립적으로 관리하면서도 데이터 일관성을 유지하는 것이 필요합니다. 이를 위해 **SAGA 패턴**, **이벤트 기반 아키텍처**, **분산 트랜잭션 관리** 등을 고려할 수 있으며, 이는 서비스가 확장될 때 시스템의 안정성과 일관성을 보장하는 데 중요한 역할을 합니다.
