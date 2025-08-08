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
: "${RAGMON_RABBIT_MONITOR_QUEUE:=ragmon.monitor}"
: "${RAGMON_RABBIT_ENABLED:=false}"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

pushd "$REPO_ROOT" >/dev/null

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
