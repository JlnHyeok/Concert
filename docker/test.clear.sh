#!/bin/bash

# KAFKA CLEAR
docker compose -f ./docker/kafka/docker-compose.test.yml down

# CONTAINER CLEAR
docker rm -f Concert_test_postgres
docker rm -f Concert_test_redis
docker rm -f Concert_test_payment_api

# IMAGE CLEAR
docker rmi concert_test_postgres
docker rmi concert_test_redis
docker rmi concert_test_payment_api

# VOLUME CLEAR
docker volume rm $(docker volume ls -qf dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)

# NETWORK CLEAR
docker network rm concert_test_network
docker network rm kafka_test_network