# Step 6. ERD 설계 및 API 명세서 작성

## 6.1 ERD 설계
<img width="1114" alt="image" src="https://github.com/user-attachments/assets/afbdc4d0-cea0-4b7d-88d0-2ab03e5e00f3">



---


## 6.2 API 명세서 및 Mock API
- 유저 대기열 및 예약 서비스를 위한 API 명세서입니다.

### 1. 토큰 발급

- **설명**: 사용자가 대기열에 등록하기 위한 토큰을 발급받습니다.
- **Method :**
  `POST`
- **Url :**
  `v1/token`
- **Request Body**:
    ```json
    {
      "userId": 1
    }
    ```
- **Response**:
    - `200 OK`
    ```json
    {
      "token": "abcd1234",
      "queueStatus": "WAITING"
    }
    ```

### 2. 대기번호 조회


- **설명**: 사용자가 현재 대기열에서의 자신의 대기번호를 조회합니다.
- **Method :**
  `GET`
- **Url :**
  `v1/queue/position`
- **Query Params**:
    - `token`: 발급받은 토큰 (필수)
- **Response**:
    - `200 OK`
    ```json
    {
      "position": 2,
      "remainingTime": "00:03:45"
    }
    ```
    - `401 Unauthorized`

### 3. 예약 가능한 날짜 조회


- **설명**: 예약 가능한 날짜 목록을 조회합니다.
- **Method :**
  `GET`
- **Url :**
 `v1/concerts/available-dates`
- **Response**:
    - `200 OK`
    ```json
    [
      "2024-10-20",
      "2024-10-21"
    ]
    ```

### 4. 특정 날짜의 예약 가능한 좌석 조회


- **설명**: 지정된 날짜의 예약 가능한 좌석 정보를 조회합니다.
- **Method :**
  `GET`
- **Url :**
  `v1/concerts/{date}/seats`
- **Query Params**:
    - `date`: 예약 날짜 (필수)
- **Response**:
    - `200 OK`
    ```json
    [
      {
        "seatNumber": "1",
        "status": "AVAILABLE"
      },
      {
        "seatNumber": "2",
        "status": "RESERVED"
      }
    ]
    ```

### 5. 좌석 예약 요청


- **설명**: 좌석을 예약하고 임시 배정합니다.
- **Method :**
  `POST`
- **Url :**
  `v1/reservations`
- **Request Body**:
    ```json
    {
      "userId": 1,
      "seatNumber": "1",
      "date": "2024-10-20"
    }
    ```
- **Response**:
    - `200 OK`
    ```json
    {
      "reservationId": 123,
      "message": "좌석 예약 성공"
    }
    ```

### 6. 잔액 충전


- **설명**: 사용자의 잔액을 충전합니다.
- **Method :**
  `POST`
- **Url :**
  `v1/balance/recharge`
- **Request Body**:
    ```json
    {
      "userId": 1,
      "amount": 10000
    }
    ```
- **Response**:
    - `200 OK`
    ```json
    {
      "message": "잔액 충전 성공"
    }
    ```

### 7. 결제 처리


- **설명**: 결제를 처리하고 결제 내역을 생성합니다.
- **Method :**
  `POST`
- **Url :**
  `v1/payments`
- **Request Body**:
    ```json
    {
      "userId": 1,
      "reservationId": 123,
      "amount": 5000
    }
    ```
- **Response**:
    - `200 OK`
    ```json
    {
      "message": "결제 성공",
      "remain" : 5000
    }
    ```
---

## 6.3 기술 스택
### 6.3.1 주요 기술
- NestJS
- TypeORM
- PostgreSQL
- npm
- Redis-Bull

### 6.3.2 패키지 구조
```bash
src/
├── application/
│   ├── services/
│   │   ├── reservation.service.ts       # 예약 관련 비즈니스 로직
│   │   ├── token-queue.service.ts       # 대기열 처리 서비스
│   │   └── payment.service.ts           # 결제 처리 서비스
│   └── facades/
│       └── reservation.facade.ts        # 여러 서비스 조율, 예약 관련 복합 로직 처리
│
├── common/
│   ├── decorators/
│   │   └── auth.decorator.ts            # 인증 관련 데코레이터
│   ├── filters/
│   │   └── http-exception.filter.ts     # 예외 처리 필터
│   └── utils/
│       └── date.util.ts                 # 날짜 처리 유틸리티
│
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts               # 유저 엔티티
│   │   ├── token-queue.entity.ts        # 토큰 대기열 엔티티
│   │   ├── seat.entity.ts               # 좌석 엔티티
│   │   ├── reservation.entity.ts        # 예약 엔티티
│   │   ├── payment.entity.ts            # 결제 엔티티
│   │   └── concert.entity.ts            # 콘서트 엔티티
│   ├── repositories/
│   │   ├── user.repository.ts           # 유저 리포지토리
│   │   ├── token-queue.repository.ts    # 대기열 리포지토리
│   │   ├── seat.repository.ts           # 좌석 리포지토리
│   │   ├── reservation.repository.ts    # 예약 리포지토리
│   │   ├── payment.repository.ts        # 결제 리포지토리
│   │   └── concert.repository.ts        # 콘서트 리포지토리
│
├── infra/
│   ├── database/
│   │   └── database.module.ts           # 데이터베이스 모듈 설정
│   └── typeorm.config.ts                # TypeORM 설정 파일
│
├── presentation/
│   ├── controllers/
│   │   ├── reservation.controller.ts    # 예약 관련 API 컨트롤러
│   │   ├── token-queue.controller.ts    # 대기열 관련 API 컨트롤러
│   │   └── payment.controller.ts        # 결제 관련 API 컨트롤러
│
└── app.module.ts                        # 메인 애플리케이션 모듈

