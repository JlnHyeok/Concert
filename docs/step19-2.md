# 테스트 시나리오 작성 및 실행

## 1. 테스트 시나리오.
- 주어진 상황에서 우리 시스템이 예상된 부하를 얼마나 정상적으로 처리할 수 있을까 판단하기 위해 아래와 같이 부하테스트를 실행하였습니다.
- 일반 유저의 입장에서 좌석 예약 및 결제 시나리오를 작성.
  1. V_User: 1000명 (초반 30초 동안 1000명까지 몰릴 것으로 예상)
  2. **[IssueToken]** 대기열 토큰 발급: 1000 \* 1TPS = **1000 TPS**
  3. 대기열 통과: 500명 (처음 500명은 바로 진입)
  4. **[CheckToken]** 나머지 인원 대기열 확인 POLLING (2초에 1번): 500 \* 0.5TPS = **250TPS**
  5. **[ReservationSeat]** 좌석 예약: 인기 좌석으로 몰릴 것 예상하여 절반만 성공한다고 가정: 500 \* 0.5TPS = **250TPS**
  6. **[PaymentReservation]** 예약 결제: 예약 성공한 사람들 전원 결제 수행: 250 \* 1TPS = **250TPS**
  7. **[예상 총 TPS]**: 1000 + 250 + 250 + 250 = **1750TPS**
  8. **[목표 응답시간 (RT)]**: 1/ (500 (목표 동시 수용 인원) \* (1750 / 1000)) = 1 / 875 = **평균 1.14ms**

## 2. 테스트 수행 결과.

### 2.1 에러 사항

- Mac Os 상에서 K6 의 VUS 를 일정 수 이상으로 설정하면 connection reset peer 에러 발생.
- Docker 환경에서 테스트 진행하여도 동일 에러 발생하여 VUS 조정하여 수행했습니다.

#### KAFKA MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/c8015164-db41-4b18-b53d-88f7660c734c)

#### DOCKER MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/b1c473f0-3964-4d41-b301-37caef1ea85e)

#### K6 MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/6fadfd2f-f961-4322-943c-ba9c4e68b15f)
