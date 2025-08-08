#!/usr/bin/env bash
set -euo pipefail

# Defaults (override via env)
: "${RAGMON_BASIC_USER:=admin}"
: "${RAGMON_BASIC_PASS:=admin}"
: "${RAGMON_RABBIT_HOST:=localhost}"
: "${RAGMON_RABBIT_PORT:=5672}"
: "${RAGMON_RABBIT_VHOST:=/}"
: "${RAGMON_RABBIT_USER:=guest}"
: "${RAGMON_RABBIT_PASS:=guest}"
: "${RAGMON_RABBIT_MONITOR_QUEUE:=pipeline.metrics}"
: "${RAGMON_RABBIT_ENABLED:=true}"
: "${RABBIT_CONTAINER_NAME:=ragmon-rabbit}"
: "${RABBIT_IMAGE:=rabbitmq:3.13-management}"

need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required to auto-start RabbitMQ. Please install Docker or start your own RabbitMQ instance." >&2
    exit 1
  fi
}

start_rabbit() {
  if docker ps --format '{{.Names}}' | grep -q "^${RABBIT_CONTAINER_NAME}$"; then
    echo "RabbitMQ container '${RABBIT_CONTAINER_NAME}' is already running."
  elif docker ps -a --format '{{.Names}}' | grep -q "^${RABBIT_CONTAINER_NAME}$"; then
    echo "Starting existing RabbitMQ container '${RABBIT_CONTAINER_NAME}'..."
    docker start "${RABBIT_CONTAINER_NAME}" >/dev/null
  else
    echo "Launching RabbitMQ container '${RABBIT_CONTAINER_NAME}'..."
    docker run -d --name "${RABBIT_CONTAINER_NAME}" \
      -p 5672:5672 -p 15672:15672 \
      -e RABBITMQ_DEFAULT_USER="${RAGMON_RABBIT_USER}" \
      -e RABBITMQ_DEFAULT_PASS="${RAGMON_RABBIT_PASS}" \
      "${RABBIT_IMAGE}" >/dev/null
  fi

  echo "Waiting for RabbitMQ management to be ready on http://localhost:15672 ..."
  for i in {1..60}; do
    if curl -fsS -u "${RAGMON_RABBIT_USER}:${RAGMON_RABBIT_PASS}" http://localhost:15672/api/overview >/dev/null; then
      echo "RabbitMQ is ready."
      break
    fi
    sleep 1
  done

  echo "Ensuring queue '${RAGMON_RABBIT_MONITOR_QUEUE}' exists..."
  curl -fsS -u "${RAGMON_RABBIT_USER}:${RAGMON_RABBIT_PASS}" \
    -H 'content-type: application/json' \
    -X PUT "http://localhost:15672/api/queues/%2F/${RAGMON_RABBIT_MONITOR_QUEUE}" \
    -d '{"durable":true}' >/dev/null || true
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

pushd "$REPO_ROOT" >/dev/null

if [[ "${RAGMON_RABBIT_ENABLED}" == "true" ]]; then
  need_docker
  start_rabbit
fi

# Build backend
./mvnw -q -DskipTests -pl ragmon-api -am package

# Start backend
(
  cd ragmon-api || exit 1
  echo "Starting ragmon-api on :8080 (Basic: $RAGMON_BASIC_USER)"
  RAGMON_BASIC_USER="$RAGMON_BASIC_USER" \
  RAGMON_BASIC_PASS="$RAGMON_BASIC_PASS" \
  RAGMON_RABBIT_HOST="$RAGMON_RABBIT_HOST" \
  RAGMON_RABBIT_PORT="$RAGMON_RABBIT_PORT" \
  RAGMON_RABBIT_VHOST="$RAGMON_RABBIT_VHOST" \
  RAGMON_RABBIT_USER="$RAGMON_RABBIT_USER" \
  RAGMON_RABBIT_PASS="$RAGMON_RABBIT_PASS" \
  RAGMON_RABBIT_MONITOR_QUEUE="$RAGMON_RABBIT_MONITOR_QUEUE" \
  RAGMON_RABBIT_ENABLED="$RAGMON_RABBIT_ENABLED" \
  ../mvnw -q spring-boot:run
) &
API_PID=$!

# Start frontend
(
  cd ragmon-web || exit 1
  echo "Installing frontend deps (if needed) and starting Vite dev server on :5173"
  npm install --silent
  npm run dev
) &
WEB_PID=$!

trap 'echo "Stopping..."; kill $API_PID $WEB_PID 2>/dev/null || true' INT TERM EXIT

wait
