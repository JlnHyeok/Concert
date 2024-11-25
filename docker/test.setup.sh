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
# 브로커 설정
BOOTSTRAP_SERVERS="Kafka00ServiceTest:9092,Kafka01ServiceTest:9092,Kafka02ServiceTest:9092"

# 토픽 생성 함수
create_topic_if_not_exists() {
  local topic=$1
  
  # 토픽 존재 여부 확인
  existing_topics=$(docker exec -it Kafka00ServiceTest \
    kafka-topics.sh --list --bootstrap-server $BOOTSTRAP_SERVERS)

  if echo "$existing_topics" | grep -q "^$topic$"; then
    echo "토픽 '$topic'이 이미 존재합니다. 생성하지 않습니다."
  else
    echo "토픽 '$topic'이 존재하지 않습니다. 생성합니다..."
    docker exec -it Kafka00ServiceTest \
      kafka-topics.sh --create \
      --topic $topic \
      --bootstrap-server $BOOTSTRAP_SERVERS
  fi
}

# 생성할 토픽 리스트
TOPICS=("payment-success" "payment-fail")

# 각 토픽 생성
for topic in "${TOPICS[@]}"; do
  create_topic_if_not_exists $topic
done