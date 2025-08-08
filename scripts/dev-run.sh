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
: "${RABBIT_CONTAINER_NAME:=hdfswatcher-rabbit}"
: "${RABBIT_IMAGE:=rabbitmq:3.13-management}"

API_PGID=""
WEB_PGID=""

need_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required to auto-start RabbitMQ. Please install Docker or start your own RabbitMQ instance." >&2
    exit 1
  fi
}

start_rabbit() {
  # Try to reuse an already-running named container first
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

stop_all() {
  echo "Stopping..."
  if [[ -n "$WEB_PGID" ]]; then
    kill -TERM -"$WEB_PGID" 2>/dev/null || true
  fi
  if [[ -n "$API_PGID" ]]; then
    kill -TERM -"$API_PGID" 2>/dev/null || true
  fi
  wait || true
}

trap stop_all INT TERM EXIT

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

pushd "$REPO_ROOT" >/dev/null

if [[ "${RAGMON_RABBIT_ENABLED}" == "true" ]]; then
  need_docker
  start_rabbit
fi

# Build backend JAR
./mvnw -q -DskipTests -pl ragmon-api -am package

# Start backend from JAR with dev profile
cd ragmon-api
JAR=$(ls -1 target/*-SNAPSHOT.jar | head -n1)
if [[ ! -f "$JAR" ]]; then
  echo "Could not find built JAR in target/." >&2
  exit 1
fi

echo "Starting ragmon-api on :8080 with profile 'dev' (Basic: $RAGMON_BASIC_USER)"
SPRING_PROFILES_ACTIVE=dev \
RAGMON_BASIC_USER="$RAGMON_BASIC_USER" \
RAGMON_BASIC_PASS="$RAGMON_BASIC_PASS" \
RAGMON_RABBIT_HOST="$RAGMON_RABBIT_HOST" \
RAGMON_RABBIT_PORT="$RAGMON_RABBIT_PORT" \
RAGMON_RABBIT_VHOST="$RAGMON_RABBIT_VHOST" \
RAGMON_RABBIT_USER="$RAGMON_RABBIT_USER" \
RAGMON_RABBIT_PASS="$RAGMON_RABBIT_PASS" \
RAGMON_RABBIT_MONITOR_QUEUE="$RAGMON_RABBIT_MONITOR_QUEUE" \
RAGMON_RABBIT_ENABLED="$RAGMON_RABBIT_ENABLED" \
nohup java -jar "$JAR" >/dev/null 2>&1 &
API_PID=$!
API_PGID=$(ps -o pgid= $API_PID | tr -d ' ')
cd ..

# Start frontend
cd ragmon-web
echo "Installing frontend deps (if needed) and starting Vite dev server on :5173"
npm install --silent >/dev/null 2>&1 || true
nohup npm run dev >/dev/null 2>&1 &
WEB_PID=$!
WEB_PGID=$(ps -o pgid= $WEB_PID | tr -d ' ')
cd ..

# Wait until killed
wait
