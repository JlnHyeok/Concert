# MONITORING 구상도

## 1. 개요

- 부하 테스트를 실행하기에 앞서, 각 지표를 시각화하기 위해서 뭐가 적절할까 고민하였습니다.
- 평소 Telegraf - Influxdb - Grafana 로 Pipeline 을 구축할 일이 많았어서 비슷한 구조로 하려다가 현재 시스템에 **데이터 적재 기능은 필요하지 않을 것 같다 판단** 하여 Prometheus 를 사용하기로 결정했습니다.
- Prometheus 를 사용하기 위해선, 각 데이터들의 metrics 를 보내주는 작업이 필요하여 다음과 같이 시스템을 구성하였습니다.

### 1.1 시스템 구성도

---

![image](https://github.com/user-attachments/assets/5c6821ef-94ae-45e3-b065-b286ebd47191)

## 2. Kafka 데이터 집계

- OpenSource로 제공되는 Kafka Dashboard UI 도 많았지만 트렌드를 보여줄 수 있는 그래프나 제가 보고싶은 항목을 커스텀하기에는 제한 사항이 있어 Grafana 로 작업하기로 결정했습니다.
- Prometheus 로 내보낼 때 어떤걸 쓸까 고민하다가 Kafka-Exporter 와 Jmx-Exporter 가 있는것을 발견했습니다.
- 아래 특징들을 비교해 본 후, 둘 다 완전한 기능을 제공하지 않는다 판단하여 두가지 다 사용했습니다.

### 2.1. Kafka Exporter vs JMX Exporter

| **특징**        | **Kafka Exporter**                       | **JMX Exporter**                                 |
| --------------- | ---------------------------------------- | ------------------------------------------------ |
| **주요 목적**   | Consumer group 상태 및 lag 모니터링      | JVM 및 Kafka Broker의 성능 및 상태 모니터링      |
| **수집 데이터** | Consumer offset, lag, partition metadata | JVM 메트릭, Kafka Broker 메트릭, 네트워크 트래픽 |
| **구성 난이도** | 비교적 간단                              | JMX 설정 필요로 약간 복잡                        |
| **장점**        | Lag 추적에 특화                          | 광범위한 성능 및 내부 데이터 제공                |
| **단점**        | JVM/Broker 상태를 모니터링하지 않음      | Consumer 그룹 lag를 직접 제공하지 않음           |

---

### 2.2 Setup

#### docker-compose.yml

```yml
  kafkaExporter:
    image: bitnami/kafka-exporter:1.7.0
    restart: always
    container_name: KafkaExporter
    ports:
      - '9308:9308'
    depends_on:
      - Kafka00Service
      # - Kafka01Service
      # - Kafka02Service
    networks:
      - local_network
    command: [
        '--kafka.server=Kafka00Service:9092',
        # '--kafka.server=Kafka01Service:9092',
        # '--kafka.server=Kafka02Service:9092',
      ]
    environment:
      - KAFKA_BROKERS=Kafka00Service:9092 #,Kafka01Service:9092,Kafka02Service:9092
      - LOG_LEVEL=INFO

JmxExporter:
    image: sscaling/jmx-prometheus-exporter
    restart: always
    container_name: JmxExporter
    volumes:
      - ./jmx-exporter/config.yml:/opt/jmx_exporter/config.yml
    ports:
      - '5556:5556'
    depends_on:
      - Kafka00Service
      # - Kafka01Service
      # - Kafka02Service
    networks:
      - local_network
```

#### prometheus.yml

```yml
scrape_configs:
  # Kafka Exporter의 메트릭을 수집하는 설정
  - job_name: kafka-exporter
    # metrics_path 기본값은 '/metrics'

    static_configs:
      - targets: ['KafkaExporter:9308']

  # JMX Exporter의 메트릭을 수집하는 설정
  - job_name: jmx-exporter
    # metrics_path 기본값은 '/metrics'

    static_configs:
      - targets: ['JmxExporter:5556']
```

---

## 3. Docker Container 데이터 집계

- 프로그램들이 모두 Container 에서 실행되기 때문에, Cpu, Memory, Traffic 등의 지표를 파악하기 위해 Grafana 작업을 진행하였습니다.
- Prometheus 로 내보내기 위해 Docker Daemon, CAdvisor 두가지 옵션으로 간추렸고, 아래 특징들을 비교 후 **CAdvisor** 를 사용하기로 결정했습니다.

### 3.1 Docker Daemon vs cAdvisor

| **특징**                | **Docker Daemon**                                   | **cAdvisor**                                                     |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| **주요 목적**           | Docker 컨테이너 관리 및 기본적인 메트릭 제공        | 컨테이너 및 호스트의 리소스 사용량 상세 모니터링                 |
| **수집 데이터**         | 컨테이너 CPU, 메모리, 네트워크, I/O 기본 메트릭     | 더 정밀한 CPU, 메모리, 네트워크, 파일 시스템 데이터              |
| **지원 환경**           | Docker 데몬이 실행되는 환경                         | Docker, Kubernetes, 및 일반 컨테이너화된 환경                    |
| **설치 필요성**         | Docker 설치 시 자동 포함                            | 별도 설치 필요 (`cadvisor` 컨테이너 등)                          |
| **설정 및 사용 난이도** | 별도 설정 없이 Docker API로 간단히 접근 가능        | 설치 및 구성 필요                                                |
| **리소스 사용량**       | Docker Daemon 프로세스에서 추가 부하 적음           | 추가 컨테이너 실행으로 리소스 사용량 증가                        |
| **확장성**              | 대규모 환경에서 적합하지만 메트릭 세분화가 제한적임 | 세밀한 모니터링 가능하지만 매우 대규모 환경에서는 추가 부담 가능 |
| **주요 장점**           | 간단하고 설정 부담이 적음                           | 상세하고 포괄적인 메트릭 제공                                    |
| **주요 단점**           | 제공되는 메트릭이 제한적임                          | 초기 설정 및 리소스 사용량이 비교적 높음                         |

---

### 3.2 Setup

#### docker-compose.yml

```yml
CAdvisor:
  image: gcr.io/cadvisor/cadvisor
  restart: always
  container_name: CAdvisor
  ports:
    - '8080:8080'
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:rw
    - /sys:/sys:ro
    - /var/lib/docker/:/var/lib/docker:ro
  networks:
    - local_network
```

#### prometheus.yml

```yml
scrape_configs:
 - job_name: docker
    # metrics_path 기본값은 '/metrics'
    # scheme 기본값은 'http'.

    static_configs:
      - targets: ['CAdvisor:8080']
```

---

## 4. K6 데이터 집계

- 부하 테스트 시행 후, 테스트 결과를 시각화 하기 위해 Grafana 를 사용하기로 결정했습니다.
- 테스트 결과 데이터 집계를 위해 **Statsd-Exporter** 를 사용하였습니다.

### 4.1 에러 사항

- output 형식을 JSON 으로 하면 각 API 에 따라 데이터를 분류할 수 있도록 TAG 라는 것이 생성되는데, Statsd 형식으로 추출하니 TAG 가 유실된 채로 전체 데이터만 나오는 현상.
  - statsd-exporter github repo 도 뒤져보고, config 파일도 만져보고 다 해보았지만 tag 가 계속 유실된 채로 나왔었음..
  - 한참을 헤메다 K6 공식문서를 파헤치던 도중 **K6_STATSD_ENABLE_TAGS** 옵션 발견!! <- Default 가 false 로 되어있어서 TAG 가 안나오던 것...
  - **K6_STATSD_ENABLE_TAGS=true ./k6 run -o output-statsd k6.js** 으로 실행하니까 TAG 값도 정상적으로 들어오는것을 확인. (10시간동안의 삽질 끝에 해결..!!)

---

### 4.2 Setup

#### docker-compose.yml

```yml
statsd-exporter:
  image: prom/statsd-exporter:latest
  container_name: StatsdExporter
  ports:
    - '8125:9125/udp'
    - '9102:9102'
  networks:
    - local_network
```

#### prometheus.yml

```yml
scrape_configs:
  - job_name: statsd-exporter
    # metrics_path 기본값은 '/metrics'

    static_configs:
      - targets: ['StatsdExporter:9102']
```

---

## 5. Grafana 연동 결과

- Grafana Setting 부터 템플릿 적용, 개별 쿼리 수정까지 작성하면 너무 길어지기에 완성본만 보여드립니다!

#### KAFKA MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/c8015164-db41-4b18-b53d-88f7660c734c)

#### DOCKER MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/b1c473f0-3964-4d41-b301-37caef1ea85e)

#### K6 MONITORING DASHBOARD

![image](https://github.com/user-attachments/assets/6fadfd2f-f961-4322-943c-ba9c4e68b15f)
