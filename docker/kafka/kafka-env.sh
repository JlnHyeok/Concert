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
