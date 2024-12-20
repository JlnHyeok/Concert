## STEP 11

### 1. 발생할 수 있는 동시성 이슈

- 유저 포인트 충전 / 사용
- 좌석 예약 및 결제

### 2. 적용 가능한 동시성 제어 방식

- 비관적 락
  - 장점: 데이터의 무결성을 보장하는 수준이 매우 높음.
  - 단점: 데이터 자체에 락을 걸어 동시성이 떨어져 성능 저하 및 Dead Lock 발생 가능성 있음.
- 낙관적 락
  - 장점: 락을 사용하지 않으므로 Dead Lock 이 발생하지 않는다.
  - 단점: 충돌 시 retry 구현 필요 및 충돌이 자주 발생하면 롤백이 많아져 성능이 떨어질 수 있음.
- 분산 락
  - 장점: 데이터의 일관성 보장 및 확장성 용이. 비동기 처리 지원
  - 단점: 구현이 복잡하고 락 관리가 네트워크를 통해 이루어지기 때문에 네트워크 지연 발생 가능성 있음.
- 직렬화 격리 수준
  - 장점: 일관성 보장 및 Phantom Read 같은 동시성 문제 방지
  - 단점: 락과 스냅샷 생성으로 인해 동시성 처리 감소 및 응답 시간 길어질 수 있음. 확장성에 한계가 있음. 구현이 복잡

### 3. 각 동시성 제어 방식의 특징 및 차이점 정리

| 구분          | 비관적 락 (Pessimistic Lock)                                       | 낙관적 락 (Optimistic Lock)                            | 분산 락 (Distributed Lock)                        | 직렬화 격리 수준 (Serializable Isolation)               |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| **개념**      | 트랜잭션이 자원에 접근할 때 미리 락을 걸어 다른 트랜잭션 접근 차단 | 데이터 변경 시점에서 충돌 검사를 통해 동시성 문제 해결 | 여러 노드에서 동일한 자원에 대한 동시 접근을 제어 | 트랜잭션이 순차적으로 실행된 것과 같은 일관성을 보장    |
| **적용 방식** | 공유 락(읽기) / 배타 락(쓰기) 사용                                 | 버전 정보 등을 통해 충돌 발생 시 롤백                  | 중앙 락 매니저나 분산 알고리즘 활용               | MVCC 또는 2단계 락(2PL) 사용                            |
| **장점**      | 데이터 무결성을 강하게 보장                                        | 충돌이 적을 경우 성능 최적화 가능                      | 분산 환경에서도 자원 동기화 가능                  | 모든 동시성 문제 예방                                   |
|               | 단순한 구현 가능                                                   | 락을 사용하지 않아 성능에 유리                         | 다양한 노드에서 동기화된 락 상태 보장             | 트랜잭션 간 일관된 순서 보장                            |
| **단점**      | 데드락(교착 상태) 위험                                             | 충돌 발생 시 롤백 비용 발생                            | 네트워크 지연 시 락 관리 복잡                     | 성능 저하 및 경합 시 병목 현상                          |
|               | 트랜잭션 병목 가능                                                 | 충돌이 자주 발생하면 오히려 비효율적                   | 분산 환경에서 복잡한 설정 필요                    | 구현이 복잡하며 확장성 문제 존재                        |
| **사용 사례** | 재고 관리, 좌석 예약                                               | 결제 시스템, 포인트 충전                               | 마이크로서비스 환경의 자원 관리                   | 금융 시스템, 복잡한 예약 시스템                         |
| **주요 특징** | 자원 접근 시 즉시 락을 걸어 경합 방지                              | 충돌 시에만 롤백하며 락을 최소화                       | 클러스터링된 시스템에서 노드 간 동기화            | 모든 트랜잭션이 순차적으로 실행된 것과 같은 효과를 제공 |

### 4. 동시성 제어 방식 비교

#### 4.1. 비관적 락 (Pessimistic Lock)

- 구현 복잡도

  - 비관적 락은 데이터베이스에서 트랜잭션이 자원에 접근하기 전에 미리 락을 설정하여 다른 트랜잭션이 해당 자원에 접근하지 못하도록 차단. 구현이 비교적 간단하지만, 락을 관리해야 하므로 트랜잭션 간의 충돌이나 데드락(교착 상태)에 대한 처리가 필요.

- 성능

  - 비관적 락은 트랜잭션 간의 경합이 잦을 때 성능 저하를 초래할 수 있음. 여러 트랜잭션이 동일한 자원에 접근하려 할 때, 락을 획득하지 못한 트랜잭션은 대기 상태가 되며, 이는 전체 시스템의 성능을 저하시킬 수 있음. 특히 데드락이 발생하면, 이를 해결하기 위한 추가적인 로직이 필요.

- 효율성
  - 이 방식은 데이터 무결성을 강하게 보장하지만, 트랜잭션의 병목 현상을 유발할 수 있음. 자원에 대한 즉각적인 락을 걸기 때문에, 경합이 심한 상황에서는 성능이 급격히 떨어질 수 있음.

#### 4.2. 낙관적 락 (Optimistic Lock)

- 구현 복잡도

  - 낙관적 락은 데이터의 변경 시점에서 충돌을 검사. 구현이 비교적 간단하며, 버전 정보를 이용하여 충돌을 감지하고 처리하는 방식. 이로 인해 락을 최소화할 수 있지만, 충돌이 발생할 경우 롤백이 필요하여 추가적인 처리가 요구.

- 성능

  - 낙관적 락은 데이터 변경 충돌이 드문 경우 성능이 우수. 여러 트랜잭션이 동시에 읽기 작업을 수행할 수 있으므로, 자원 경합이 적을 때 효율적. 그러나 충돌이 자주 발생하면 오히려 비효율적일 수 있음.

- 효율성
  - 낙관적 락은 락을 최소화하여 시스템 자원의 사용을 최적화. 충돌이 발생하는 경우에만 롤백을 하므로, 경합이 적을 때는 효율성이 높다.

#### 4.3. 분산 락 (Distributed Lock)

- 구현 복잡도

  - 분산 락은 여러 노드에서 동일한 자원에 대한 동시 접근을 제어하는 방식. 중앙 락 매니저나 분산 알고리즘을 활용하여 구현. 이 방식은 구현이 복잡하며, 클러스터 환경에서의 락 관리를 위한 추가적인 고려가 필요.

- 성능

  - 분산 락은 네트워크 지연으로 인해 성능 저하가 발생할 수 있음. 락 요청과 해제를 위해 추가적인 네트워크 호출이 필요하므로, 성능이 저하될 수 있다. 하지만 동기화된 상태를 유지할 수 있어, 여러 노드 간의 자원 충돌을 방지할 수 있다.

- 효율성
  - 분산 락은 클러스터 환경에서 자원의 동기화를 효과적으로 수행하지만, 락을 관리하는데 따른 복잡성으로 인해 자원의 사용 효율성이 떨어질 수 있다.

#### 4.4. 직렬화 격리 수준 (Serializable Isolation)

- 구현 복잡도

  - 직렬화 격리 수준은 모든 트랜잭션이 순차적으로 실행된 것과 같은 일관성을 보장. 이 방식은 MVCC 또는 2단계 락(2PL)을 사용하여 구현. 복잡한 트랜잭션 관리를 필요로 하며, 구현 난이도가 높은 편.

- 성능

  - 이 방식은 성능 저하를 초래할 수 있으며, 경합이 발생할 경우 병목 현상이 발생할 수 있다. 모든 트랜잭션이 순차적으로 실행되기 때문에, 특히 높은 동시성을 요구하는 시스템에서는 성능에 부정적인 영향을 미칠 수 있다.

- 효율성
  - 직렬화 격리 수준은 모든 동시성 문제를 예방할 수 있지만, 트랜잭션의 성능 저하와 함께 경합 시 병목 현상이 발생할 수 있다. 이로 인해 시스템의 전반적인 효율성이 저하될 수 있음.

### 결론

- 구현 복잡도와 사용 케이스들을 고려하였을 때, 각 API 에 어떤 동시성 제어 방식을 적용할 지 생각해보았습니다.
- 구현 복잡도를 생각하니 비관적 락이나 낙관적 락으로 비교해보는게 좋을 것 같아 둘 중에서 사용하기로 추려냈습니다.

1. 포인트 충전 및 사용
   - 한 유저가 동시에 여러 요청을 보냈을 시, 순차적으로 처리하면 된다고 생각하기에 비관적 락을 적용하기로 결정했습니다.
2. 좌석 예약 및 결제
   - 여러 유저가 동시에 좌석 예약 및 결제 요청을 보낼 때, 제일 먼저 선점한 한 사람만 통과시켜야한다고 생각합니다.
   - 처음 개발 시에는 비관적 락으로 처리하였으나, 제일 먼저 선점한 한사람만 통과하고 나머지는 동시에 요청이 들어와도 다 fail 처리하면 된다고 생각하며, 동시 요청의 수 점점 많아질수록 낙관적 락의 성능이 더 좋을 것 같아 낙관적 락으로 수정하기로 결정했습니다.
