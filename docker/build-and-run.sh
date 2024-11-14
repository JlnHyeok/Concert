#!/bin/bash
docker network create concert_network

docker build -t concert_postgres -f ./docker/postgres/Dockerfile  .
docker build -t concert_redis -f ./docker/redis/Dockerfile .
docker build -t concert_payment_api -f ./docker/payment_server/Dockerfile ./docker/payment_server
docker build -t concert_main_server .

docker run -d --name Concert_postgres -p 5432:5432 --network concert_network concert_postgres
docker run -d --name Concert_redis -p 6379:6379 --network concert_network -e ALLOW_EMPTY_PASSWORD=yes concert_redis
docker run -d --name Concert_payment_api -p 4000:4000 --network concert_network concert_payment_api
docker run -d --name Concert_main -p 3000:3000 --network concert_network concert_main_server