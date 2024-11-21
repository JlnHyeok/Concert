# KAFKA CONFIG OPTIONS & 설정

## 0. 개요
- Kafka 가 드디어 동물원을 탈출하고 Kraft Mode 라는게 새로 나왔길래 그에 맞춰 적용해보았습니다. (공식문서에 따르면 zookeeper는 kafka 4.0 부터 지원이 중단될 예정이라고 한다.)
# 

### 0.1 들어가기에 앞서..

#### 0.1.1 ZooKeeper란?
#
- ZooKeeper 는 ZooKeeper Ensemble과 Kafka Cluster 가 존재하며, Kafka Cluster 중 하나의 브로커가 컨트롤러 역할을 하게 됨.
- 컨트롤러는 파티션의 리더를 선출 및 리더 선출 정보를 브로커에게 전달하며 ZooKeeper에 리더 정보 기록 역할 담당.
- 컨트롤러의 선출 작업은 ZooKeeper 를 통해 이루어지며, ZooKeeper 의 임시노드에 가장 먼저 연결된 브로커가 컨트롤러 역할을 함.
- Kafka 자체가 아닌 외부에서 메타데이터를 관리하여 Kafka 확장성에 한계가 있다.

<img width="388" alt="image" src="https://github.com/user-attachments/assets/49e7eb98-b37c-4e43-b968-879c694d031b">

---

#### 0.1.2 Kraft란?
#
- KRaft 에서는 ZooKeeper의 의존성을 제거하고, Kafka 단일 어플리케이션 내에서 메타데이터 관리 기능을 수행하는 독립적인 구조
- 메타데이터를 Kafka 자체에서 관리하기 때문에 메타데이터의 일관성과 안정성 보장 및 확장성이 좋아짐.
- ZooKeeper 에서 1개이던 컨트롤러가 3개로 늘어나고, 이들 중 하나의 컨트롤러가 액티브 컨트롤러이면서 리더 역할 담당
- 액티브 컨트롤러가 장애 또는 종료되는 경우, 새로운 액티브 컨트롤러 선출

<img width="410" alt="image" src="https://github.com/user-attachments/assets/d76fa0f0-76a5-4c3f-afcf-ac51fb008910">

---

### 0.2 Kraft 의 성능
- KRaft의 주요 성능 개선 중 하나는 파티션 리더 선출 작업의 최적화이다.
- 소수의 파티션에 대한 리더 선출은 Kafka 혹은 Client들에게 별 다른 영향이 없으나, 대량의 파티션에 대한 리더 선출은 다소 시간이 소요될 수 있다.
- ZooKeeper 모드의 경우, Kafka Cluster 전체의 파티션 제한은 약 200,000개 정도였으나, 리더 선출 과정을 개선한 KRaft 모드에서는 훨씬 더 많은 파티션 생성 가능

#### Confluent 에서 공개한 Kraft Mode 와 Zookeeper Mode 의 속도 비교
<img width="450" alt="image" src="https://github.com/user-attachments/assets/b63ecf49-935f-45f0-bec8-f8975afa9637">

#### 왜 이러한 차이가 나는 것일까..?
- 이러한 속도 차이가 나는 이유는 KRaft 모드에서 컨트롤러는 메모리 내에 메타데이터 캐시를 유지하고 있으며, ZooKeeper의 의존성도 제거하여 내부적으로 메타데이터의 동기화과 관리 과정을 효율적으로 개선했기 때문.
- 또한 최신 메타데이터가 메모리에 유지되고 있으므로, 액티브 컨트롤러 장애 시 메타데이터 복제 시간도 줄어들어 보다 효율적인 리더 선출 

---

## 1. DOCKER-COMPOSE 에서 사용할 환경 변수 지정 (CUSTOM)

```bash
### ex) /docker/kafka/docker-compose.yml

# Kafka 브로커 토픽 자동 생성을 활성화하는지 여부 (true 또는 false)
# - 클라이언트가 존재하지 않는 토픽에 메시지를 게시하거나 구독하려고 할 때 토픽을 자동으로 생성할지 여부를 나타낸다. 테스트 목적으로 true로 설정
- KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true

#######################
###### KRAFT 설정 ######
#######################

# 고유 식별자 설정
- KAFKA_CFG_BROKER_ID=0
- KAFKA_CFG_NODE_ID=0

# 클러스터 설정 (공유 클러스터) - 모든 브로커가 같은 클러스터 ID를 공유해서 클러스터로 인식되도록 설정 (22글자로 맞춰줘야함)
# Kafka Raft Mode 를 사용할 때는 클러스터 ID를 설정해야함
- KAFKA_KRAFT_CLUSTER_ID=MyKafkaKraftClusterIDv

# 컨트롤러 쿼럼 설정 (이 Raft 클러스터의 컨트롤러 쿼럼 구성원을 지정합니다.) - 클러스터 내의 모든 브로커가 컨트롤러 역할을 수행할 수 있음을 나타낸다.
- KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@Kafka00Service:9093,1@Kafka01Service:9093,2@Kafka02Service:9093

# 브로커가 수행할 역할 정의 (controller, broker)
- KAFKA_CFG_PROCESS_ROLES=controller,broker

##########################
###### LISTENER 설정 ######
##########################

# 평문 통신을 허용하는지 여부 (yes 또는 no) - kafka는 통신을 암호화하기 위해 SSL/TLS를 사용할 수 있지만, 테스트 목적으로 평문 통신을 허용할 수 있다.
- ALLOW_PLAINTEXT_LISTENER=yes

# Kafka 브로커가 사용할 리스너 지정 - 브로커가 사용하는 리스너를 정의하고, 외부 클라이언트가 브로커에 연결할 때 사용할 주소를 지정한다.
- KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
- KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://Kafka00Service:9092,EXTERNAL://127.0.0.1:10000
- KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT

# 컨트롤러 브로커의 리스너를 지정 하는데 사용. 클러스터에서 컨트롤러 역할을 수행하는 브로커가 어떤 네트워크 인터페이스를 통해 다른 브로커와 통신할 지 결정
# - 컨트롤러 브로커가 다른 브로커와 통신할 때 : 0.0.0.0:9093 사용
# - 클라이언트와의 통신 및 브로커 간의 기본 통신: 0.0.0.0:9092 사용
- KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER

############################
###### CLUSTERING 설정 ######
############################

# 트랜잭션, Offset, Replication_Factor, ISR 설정 - 데이터의 내구성과 가용성을 보장하기 위해 설정
# 오프셋 토픽의 복제 인수 설정. 오프셋 토픽은 컨슈머 그룹이 각 파티션의 현재 오프셋(마지막으로 읽은 위치)을 저장하는 데 사용됨.
# - 오프셋 토픽의 복제 인수를 3으로 설정하면 오프셋 토픽의 각 파티션이 3개의 브로커에 복제됨. -> 데이터의 내구성 및 가용성을 보장
- KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3

# 트랜잭션 상태 로그의 복제 인수 설정. 트랜잭션 상태 로그는 트랜잭션 상태를 저장하는 데 사용됨.
# - 트랜잭션 상태 로그의 복제 인수를 3으로 설정하면 트랜잭션 상태 로그의 각 파티션이 3개의 브로커에 복제됨. -> 데이터의 내구성 및 가용성을 보장
- KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3

# 기본 복제 인수 설정. 토픽이 생성될 때 기본 복제 인수를 사용함.
# - 기본 복제 인수를 3으로 설정하면 새로운 토픽이 생성될 때 기본적으로 3개의 파티션에 저장됨.
- KAFKA_CFG_DEFAULT_REPLICATION_FACTOR=3

# 트랜잭션 상태 로그의 최소 ISR (In-Sync Replica, 동기화 된 복제본) 수 설정.
# ISR은 현재 리더와 동기화 된 복제본의 집합을 나타냄.
# - 트랜잭션 상태 로그의 최소 ISR 수를 2로 설정하면 트랜잭션 상태 로그의 각 파티션이 최소 2개의 동기화된 복제본을 가져야 함을 의미.
# - ISR 의 수가 설정된 최소 ISR 수보다 작아지면 해당 파티션에 새로운 메시지를 쓰지 않음.
- KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2
- KAFKA_NUM_PARTITIONS=3
```

## 2. KAFKA DOCKER SETUP 시 실행 될 kafka-env.sh 작성

- bitnami/kafka github 에서 kafka-env.sh 찾아서 수정

```bash
### kafka-env.sh 파일

#!/bin/bash
# Copyright Broadcom, Inc. All Rights Reserved.
# SPDX-License-Identifier: APACHE-2.0
#
# Environment configuration for kafka

# The values for all environment variables will be set in the below order of precedence
# 1. Custom environment variables defined below after Bitnami defaults
# 2. Constants defined in this file (environment variables with no default), i.e. BITNAMI_ROOT_DIR
# 3. Environment variables overridden via external files using *_FILE variables (see below)
# 4. Environment variables set externally (i.e. current Bash context/Dockerfile/userdata)

# Load logging library
# shellcheck disable=SC1090,SC1091
. /opt/bitnami/scripts/liblog.sh

export BITNAMI_ROOT_DIR="/opt/bitnami"
export BITNAMI_VOLUME_DIR="/bitnami"

# Logging configuration
export MODULE="${MODULE:-kafka}"
export BITNAMI_DEBUG="${BITNAMI_DEBUG:-false}"

# By setting an environment variable matching *_FILE to a file path, the prefixed environment
# variable will be overridden with the value specified in that file
kafka_env_vars=(
    KAFKA_MOUNTED_CONF_DIR
    KAFKA_INTER_BROKER_USER
    KAFKA_INTER_BROKER_PASSWORD
    KAFKA_CONTROLLER_USER
    KAFKA_CONTROLLER_PASSWORD
    KAFKA_CERTIFICATE_PASSWORD
    KAFKA_TLS_TRUSTSTORE_FILE
    KAFKA_TLS_TYPE
    KAFKA_TLS_CLIENT_AUTH
    KAFKA_OPTS
    KAFKA_CFG_SASL_ENABLED_MECHANISMS
    KAFKA_KRAFT_CLUSTER_ID
    KAFKA_SKIP_KRAFT_STORAGE_INIT
    KAFKA_CLIENT_LISTENER_NAME
    KAFKA_ZOOKEEPER_PROTOCOL
    KAFKA_ZOOKEEPER_PASSWORD
    KAFKA_ZOOKEEPER_USER
    KAFKA_ZOOKEEPER_TLS_KEYSTORE_PASSWORD
    KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_PASSWORD
    KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_FILE
    KAFKA_ZOOKEEPER_TLS_VERIFY_HOSTNAME
    KAFKA_ZOOKEEPER_TLS_TYPE
    KAFKA_CLIENT_USERS
    KAFKA_CLIENT_PASSWORDS
    KAFKA_HEAP_OPTS
)
for env_var in "${kafka_env_vars[@]}"; do
    file_env_var="${env_var}_FILE"
    if [[ -n "${!file_env_var:-}" ]]; then
        if [[ -r "${!file_env_var:-}" ]]; then
            export "${env_var}=$(< "${!file_env_var}")"
            unset "${file_env_var}"
        else
            warn "Skipping export of '${env_var}'. '${!file_env_var:-}' is not readable."
        fi
    fi
done
unset kafka_env_vars

# Paths
export KAFKA_BASE_DIR="${BITNAMI_ROOT_DIR}/kafka"
export KAFKA_VOLUME_DIR="/bitnami/kafka"
export KAFKA_DATA_DIR="${KAFKA_VOLUME_DIR}/data"
export KAFKA_CONF_DIR="${KAFKA_BASE_DIR}/config"
export KAFKA_CONF_FILE="${KAFKA_CONF_DIR}/server.properties"
export KAFKA_MOUNTED_CONF_DIR="${KAFKA_MOUNTED_CONF_DIR:-${KAFKA_VOLUME_DIR}/config}"
export KAFKA_CERTS_DIR="${KAFKA_CONF_DIR}/certs"
export KAFKA_INITSCRIPTS_DIR="/docker-entrypoint-initdb.d"
export KAFKA_LOG_DIR="${KAFKA_BASE_DIR}/logs"
export KAFKA_HOME="$KAFKA_BASE_DIR"
export PATH="${KAFKA_BASE_DIR}/bin:${BITNAMI_ROOT_DIR}/java/bin:${PATH}"

# System users (when running with a privileged user)
export KAFKA_DAEMON_USER="kafka"
export KAFKA_DAEMON_GROUP="kafka"

# Kafka runtime settings
export KAFKA_INTER_BROKER_USER="${KAFKA_INTER_BROKER_USER:-user}"
export KAFKA_INTER_BROKER_PASSWORD="${KAFKA_INTER_BROKER_PASSWORD:-bitnami}"
export KAFKA_CONTROLLER_USER="${KAFKA_CONTROLLER_USER:-controller_user}"
export KAFKA_CONTROLLER_PASSWORD="${KAFKA_CONTROLLER_PASSWORD:-bitnami}"
export KAFKA_CERTIFICATE_PASSWORD="${KAFKA_CERTIFICATE_PASSWORD:-}"
export KAFKA_TLS_TRUSTSTORE_FILE="${KAFKA_TLS_TRUSTSTORE_FILE:-}"
export KAFKA_TLS_TYPE="${KAFKA_TLS_TYPE:-JKS}"
export KAFKA_TLS_CLIENT_AUTH="${KAFKA_TLS_CLIENT_AUTH:-required}"
export KAFKA_OPTS="${KAFKA_OPTS:-}"

# Kafka configuration overrides
export KAFKA_CFG_SASL_ENABLED_MECHANISMS="${KAFKA_CFG_SASL_ENABLED_MECHANISMS:-PLAIN,SCRAM-SHA-256,SCRAM-SHA-512}"
export KAFKA_KRAFT_CLUSTER_ID="${KAFKA_KRAFT_CLUSTER_ID:-}"
export KAFKA_SKIP_KRAFT_STORAGE_INIT="${KAFKA_SKIP_KRAFT_STORAGE_INIT:-false}"
export KAFKA_CLIENT_LISTENER_NAME="${KAFKA_CLIENT_LISTENER_NAME:-}"

# ZooKeeper connection settings
export KAFKA_ZOOKEEPER_PROTOCOL="${KAFKA_ZOOKEEPER_PROTOCOL:-PLAINTEXT}"
export KAFKA_ZOOKEEPER_PASSWORD="${KAFKA_ZOOKEEPER_PASSWORD:-}"
export KAFKA_ZOOKEEPER_USER="${KAFKA_ZOOKEEPER_USER:-}"
export KAFKA_ZOOKEEPER_TLS_KEYSTORE_PASSWORD="${KAFKA_ZOOKEEPER_TLS_KEYSTORE_PASSWORD:-}"
export KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_PASSWORD="${KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_PASSWORD:-}"
export KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_FILE="${KAFKA_ZOOKEEPER_TLS_TRUSTSTORE_FILE:-}"
export KAFKA_ZOOKEEPER_TLS_VERIFY_HOSTNAME="${KAFKA_ZOOKEEPER_TLS_VERIFY_HOSTNAME:-true}"
export KAFKA_ZOOKEEPER_TLS_TYPE="${KAFKA_ZOOKEEPER_TLS_TYPE:-JKS}"

# Authentication
export KAFKA_CLIENT_USERS="${KAFKA_CLIENT_USERS:-user}"
export KAFKA_CLIENT_PASSWORDS="${KAFKA_CLIENT_PASSWORDS:-bitnami}"

# Java settings
export KAFKA_HEAP_OPTS="${KAFKA_HEAP_OPTS:--Xmx1024m -Xms1024m}"

# Custom environment variables may be defined below
# Kafka 브로커 자동 토픽 생성 활성화 (true 또는 false)
export KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE="${KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE:-true}"

#######################
#### KRAFT 설정 ######
#######################

# 고유 식별자 설정
export KAFKA_CFG_BROKER_ID="${KAFKA_CFG_BROKER_ID:-0}"
export KAFKA_CFG_NODE_ID="${KAFKA_CFG_NODE_ID:-0}"

# Kafka Raft Mode 설정: 클러스터 ID 설정 (22글자)
export KAFKA_KRAFT_CLUSTER_ID="${KAFKA_KRAFT_CLUSTER_ID:-MyKafkaKraftClusterIDv}"

# 컨트롤러 쿼럼 설정 (이 Raft 클러스터의 컨트롤러 쿼럼 구성원 지정)
export KAFKA_CFG_CONTROLLER_QUORUM_VOTERS="${KAFKA_CFG_CONTROLLER_QUORUM_VOTERS:-0@Kafka00Service:9093,1@Kafka01Service:9093,2@Kafka02Service:9093}"

# 브로커 역할 설정 (controller, broker)
export KAFKA_CFG_PROCESS_ROLES="${KAFKA_CFG_PROCESS_ROLES:-controller,broker}"

##########################
#### LISTENER 설정 ######
##########################

# 평문 통신 허용 여부 (yes 또는 no)
export ALLOW_PLAINTEXT_LISTENER="${ALLOW_PLAINTEXT_LISTENER:-yes}"

# Kafka 리스너 설정
export KAFKA_CFG_LISTENERS="${KAFKA_CFG_LISTENERS:-PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094}"
export KAFKA_CFG_ADVERTISED_LISTENERS="${KAFKA_CFG_ADVERTISED_LISTENERS:-PLAINTEXT://Kafka00Service:9092,EXTERNAL://127.0.0.1:10000}"
export KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP="${KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP:-CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT}"

# 컨트롤러 브로커의 리스너 이름 설정
export KAFKA_CFG_CONTROLLER_LISTENER_NAMES="${KAFKA_CFG_CONTROLLER_LISTENER_NAMES:-CONTROLLER}"

############################
#### CLUSTERING 설정 ######
############################

# 오프셋 토픽의 복제 인수 설정
export KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR="${KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR:-3}"

# 트랜잭션 상태 로그 복제 인수 설정
export KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR="${KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR:-3}"

# 기본 복제 인수 설정
export KAFKA_CFG_DEFAULT_REPLICATION_FACTOR="${KAFKA_CFG_DEFAULT_REPLICATION_FACTOR:-3}"

# 트랜잭션 상태 로그의 최소 ISR (동기화된 복제본) 수 설정
export KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR="${KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR:-2}"

```

## 3. KRAFT 용 CONFIG 파일 작성

- CUSTOM 한 환경 변수 적용을 위해 CONFIG 파일 작성

```bash
### Ex) kraft/broker.properties

############################# 서버 기본 설정 #############################

# 이 서버의 역할. 이 설정은 KRaft 모드로 전환합니다.
process.roles=${KAFKA_PROCESS_ROLES:-broker}  # 환경변수로 설정, 기본값 broker

# 이 인스턴스의 역할과 관련된 노드 ID
node.id=${KAFKA_NODE_ID:-2}  # 환경변수로 설정, 기본값 2

# 컨트롤러 쿼럼 연결 문자열
controller.quorum.voters=${KAFKA_CONTROLLER_QUORUM_VOTERS:-1@localhost:9093}  # 환경변수로 설정, 기본값 1@localhost:9093

############################# 소켓 서버 설정 #############################

# 소켓 서버가 수신할 주소. 구성하지 않으면 호스트 이름은
# java.net.InetAddress.getCanonicalHostName()의 값이 사용되며,
# PLAINTEXT 리스너 이름과 포트 9092가 기본값으로 설정됩니다.
#   형식:
#     listeners = 리스너_이름://호스트_이름:포트
#   예시:
#     listeners = PLAINTEXT://your.host.name:9092
listeners=${KAFKA_LISTENERS:-PLAINTEXT://localhost:9092}  # 환경변수로 설정, 기본값 PLAINTEXT://localhost:9092

# 브로커 간 통신에 사용되는 리스너 이름
inter.broker.listener.name=${KAFKA_INTER_BROKER_LISTENER_NAME:-PLAINTEXT}  # 환경변수로 설정, 기본값 PLAINTEXT

# 클라이언트에게 브로커가 광고할 리스너 이름, 호스트 이름 및 포트.
# 설정하지 않으면 "listeners"의 값이 사용됩니다.
advertised.listeners=${KAFKA_ADVERTISED_LISTENERS:-PLAINTEXT://localhost:9092}  # 환경변수로 설정, 기본값 PLAINTEXT://localhost:9092

# 컨트롤러가 사용할 리스너 이름들의 쉼표로 구분된 목록.
# KRaft 모드에서는 필수입니다. `process.roles=broker`인 노드에서는 첫 번째 리스너만 브로커에서 사용됩니다.
controller.listener.names=${KAFKA_CONTROLLER_LISTENER_NAMES:-CONTROLLER}  # 환경변수로 설정, 기본값 CONTROLLER

# 리스너 이름을 보안 프로토콜에 매핑합니다. 기본값은 동일하게 설정됩니다. 더 자세한 내용은 구성 문서를 참조하세요.
listener.security.protocol.map=${KAFKA_LISTENER_SECURITY_PROTOCOL_MAP:-CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL}  # 환경변수로 설정

# 서버가 네트워크에서 요청을 수신하고 응답을 전송하는 데 사용하는 스레드 수
num.network.threads=${KAFKA_NUM_NETWORK_THREADS:-3}  # 환경변수로 설정, 기본값 3

# 서버가 요청을 처리하는 데 사용하는 스레드 수 (디스크 I/O 포함)
num.io.threads=${KAFKA_NUM_IO_THREADS:-8}  # 환경변수로 설정, 기본값 8

# 소켓 서버에서 사용하는 송신 버퍼(SO_SNDBUF)
socket.send.buffer.bytes=${KAFKA_SOCKET_SEND_BUFFER_BYTES:-102400}  # 환경변수로 설정, 기본값 102400

# 소켓 서버에서 사용하는 수신 버퍼(SO_RCVBUF)
socket.receive.buffer.bytes=${KAFKA_SOCKET_RECEIVE_BUFFER_BYTES:-102400}  # 환경변수로 설정, 기본값 102400

# 소켓 서버가 수락할 수 있는 요청의 최대 크기 (OOM 방지)
socket.request.max.bytes=${KAFKA_SOCKET_REQUEST_MAX_BYTES:-104857600}  # 환경변수로 설정, 기본값 104857600

############################# 로그 기본 설정 #############################

# 로그 파일을 저장할 디렉터리 목록 (쉼표로 구분)
log.dirs=${KAFKA_LOG_DIRS:-/tmp/kraft-broker-logs}  # 환경변수로 설정, 기본값 /tmp/kraft-broker-logs

# 기본 토픽당 로그 파티션 수. 더 많은 파티션은 소비에 대한 병렬성을 높이지만
# 브로커에 더 많은 파일을 생성하게 됩니다.
num.partitions=${KAFKA_NUM_PARTITIONS:-1}  # 환경변수로 설정, 기본값 1

# 시작 시 로그 복구 및 종료 시 플러싱에 사용되는 데이터 디렉터리당 스레드 수
num.recovery.threads.per.data.dir=${KAFKA_NUM_RECOVERY_THREADS_PER_DATA_DIR:-1}  # 환경변수로 설정, 기본값 1

############################# 내부 토픽 설정 #############################

# 그룹 메타데이터 내부 토픽 "__consumer_offsets" 및 "__transaction_state"의 복제 계수
offsets.topic.replication.factor=${KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR:-1}  # 환경변수로 설정, 기본값 1

# 트랜잭션 상태 로그 토픽의 복제 계수
transaction.state.log.replication.factor=${KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR:-1}  # 환경변수로 설정, 기본값 1

# 트랜잭션 상태 로그의 최소 ISR (In-Sync Replicas)
transaction.state.log.min.isr=${KAFKA_TRANSACTION_STATE_LOG_MIN_ISR:-1}  # 환경변수로 설정, 기본값 1

############################# 로그 플러시 정책 #############################

# 메시지는 즉시 파일 시스템에 기록되지만 기본적으로 OS 캐시를 지연시켜 fsync()를 호출합니다.
# 다음 설정은 디스크에 데이터를 플러시하는 방식을 제어합니다.
# 중요한 트레이드오프가 있습니다:
#    1. 내구성: 복제를 사용하지 않으면 플러시되지 않은 데이터가 손실될 수 있습니다.
#    2. 지연: 매우 긴 플러시 간격은 플러시 시 지연 스파이크를 일으킬 수 있습니다.
#    3. 처리량: 플러시는 가장 비싼 작업 중 하나이며, 짧은 플러시 간격은 과도한 탐색을 초래할 수 있습니다.
# 이 설정들은 데이터를 일정 시간 후 또는 N개의 메시지 후에 디스크에 플러시하도록 구성할 수 있습니다.

# 데이터를 디스크에 플러시하기 전 수락할 메시지 수
#log.flush.interval.messages=10000

# 메시지가 로그에 저장된 후 강제로 플러시하기까지 최대 시간
#log.flush.interval.ms=1000

############################# 로그 보존 정책 #############################

# 로그 세그먼트 처분을 제어하는 설정입니다. 정책은 시간 경과 후 또는 특정 크기까지 로그가 축적된 후 세그먼트를 삭제하도록 설정할 수 있습니다.
# 두 조건 중 하나라도 충족되면 세그먼트가 삭제됩니다. 삭제는 항상 로그의 끝에서 발생합니다.

# 로그 파일이 삭제되기 전에 최소 연령
log.retention.hours=${KAFKA_LOG_RETENTION_HOURS:-168}  # 환경변수로 설정, 기본값 168

# 로그의 크기 기반 보존 정책. 세그먼트는 log.retention.bytes 미만으로 떨어지지 않으면 삭제됩니다.
# log.retention.hours와 독립적으로 작동합니다.
#log.retention.bytes=1073741824

# 로그 세그먼트 파일의 최대 크기. 이 크기에 도달하면 새 로그 세그먼트가 생성됩니다.
log.segment.bytes=${KAFKA_LOG_SEGMENT_BYTES:-1073741824}  # 환경변수로 설정, 기본값 1073741824

# 로그 세그먼트가 보존 정책에 따라 삭제할 수 있는지 확인하는 간격
log.retention.check.interval.ms=${KAFKA_LOG_RETENTION_CHECK_INTERVAL_MS:-300000}  # 환경변수로 설정, 기본값 300000
```

## 4. kafka-env.sh VOLUME MAPPING

- 실행 파일 및 CONFIG FILE VOLUME MAPPING

```bash
volumes:
  - ./kafka-env.sh:/opt/bitnami/kafka/scripts/kafka-env.sh
  - ./kraft:/opt/bitnami/kafka/config/kraft
```
