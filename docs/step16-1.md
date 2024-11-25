# Concert 예약 프로젝트

Concert Reservation Project는 Docker를 사용하여 Postgres, Redis, Concert Server, Concert Payment API Server로 구성된 서비스입니다. 이 프로젝트는 간단한 명령어로 모든 서비스를 각각의 컨테이너에서 실행하도록 설정되어 있습니다.

---

## 프로젝트 구성도

아래 다이어그램은 각 서비스가 어떻게 상호작용하는지 보여줍니다.

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
            +------v------+      +-------v-------+
            | Concert     |      | Concert       |
            | Server      |----->| Payment API   |
            +-------------+      +---------------+
```

- **Postgres**: 데이터베이스를 관리하며, 사용자 정보와 예약 관련 데이터를 저장합니다.
- **Redis**: 대기열 및 토큰 관리를 담당합니다.
- **Concert Server**: 예약 서비스의 주요 기능을 담당합니다.
- **Concert Payment API Server**: 결제 처리를 담당하며 Concert Server와 통신하여 결제 프로세스를 수행합니다.

---

## 프로젝트 실행

이 프로젝트는 도커 환경에서 실행됩니다. Docker가 설치되어 있어야 하며, `docker/build-and-run.sh` 파일을 통해 모든 컨테이너가 설치 및 실행됩니다.

### env

프로젝트 root 경로에 .env 파일을 아래와 같이 작성해주세요.

```env
DB_HOST=Concert_postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=concert
DB_SYNC=true
DB_LOGGING=true

JWT_SECRET=SeCReT_kEY
JWT_EXPIRES_IN=1h

NUMBER_OF_PROCESS=5

REDIS_HOST=Concert_redis
REDIS_PORT=6379
CACHE_TTL=180000
CACHE_MAX=1000
```

### 1. 실행 명령어

다음 명령어로 도커 환경에서 프로젝트를 실행할 수 있습니다:

```bash
npm run start:docker
```

**실행 확인**

1. 실행 스크립트 입력
   ![image](https://github.com/user-attachments/assets/0a9874fa-a398-4fc2-ab8c-4448d303e996)

2. Docker-Desktop 확인
   ![image](https://github.com/user-attachments/assets/0a32324d-01e9-4dd9-b421-dde36146e62b)

### 2. 주요 포트

- Postgres: 5432
- Redis: 6379
- Concert Server: 3000
- Concert Payment Api Server: 4000

---

### 3. API 확인

#### 3.1 Waiting-queue

---

##### **Issue**

![image](https://github.com/user-attachments/assets/0a7c53dd-82ed-4f4a-a99f-d9ff62b7e1c9)

##### **Check**

![image](https://github.com/user-attachments/assets/245ae3b7-622e-484b-bb00-f93fd041e634)

---

#### 3.2 User

---

##### **Create**

![image](https://github.com/user-attachments/assets/842488a4-b2c8-4f2a-835a-ad7282070c25)

##### **Charge**

![image](https://github.com/user-attachments/assets/55f24b78-3e4a-4821-9d03-916add47ad08)

---

#### 3.3 Concert

---

##### **Create Concert**

![image](https://github.com/user-attachments/assets/21fe36bf-50d9-416a-8381-066130c197ae)

##### **Create Schedule**

![image](https://github.com/user-attachments/assets/de121c48-d817-43c6-9ed5-090305efce7b)

##### **Create Seat**

![image](https://github.com/user-attachments/assets/8e9ad120-05b3-4acb-a5f0-264502af1d0d)

##### **Reservation Seat**

![image](https://github.com/user-attachments/assets/a014e44d-fa08-4a3f-b30f-afa5871a90a8)

##### **Payment**

![image](https://github.com/user-attachments/assets/39a7d183-f0b4-4447-af31-d4796b6f6d1b)
