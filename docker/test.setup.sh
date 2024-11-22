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
docker exec -it Kafka00ServiceTest \
kafka-topics.sh --create \
--topic payment.success \
--bootstrap-server Kafka00ServiceTest:9092,Kafka01ServiceTest:9092,Kafka02ServiceTest:9092

docker exec -it Kafka00ServiceTest \
kafka-topics.sh --create \
--topic payment.fail \
--bootstrap-server Kafka00ServiceTest:9092,Kafka01ServiceTest:9092,Kafka02ServiceTest:9092