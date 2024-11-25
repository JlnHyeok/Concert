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

# KAFKA TOPICS
# 브로커 설정
BOOTSTRAP_SERVERS="Kafka00Service:9092" # ,Kafka01Service:9092,Kafka02Service:9092"


# 토픽 생성 함수
create_topic_if_not_exists() {
  local topic=$1
  
  # 토픽 존재 여부 확인
  existing_topics=$(docker exec -it Kafka00Service \
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
