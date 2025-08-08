# Quick Reference

## Commands (to be expanded as code lands)

- Initialize repo (done)
- Build backend: `./mvnw clean package` (once scaffolded)
- Run backend: `./mvnw spring-boot:run`
- Start frontend: `npm run dev` (once scaffolded)

## Ports (tentative)
- API: 8080
- UI dev: 5173

## Key Endpoints (tentative)
- `GET /api/apps`
- `GET /api/queues`
- `GET /api/metrics`
- `GET /api/events/recent`
- Stream: `/stream` (SSE default)

## Config Env Vars
- `RAGMON_RABBIT_HOST`, `RAGMON_RABBIT_PORT`, `RAGMON_RABBIT_VHOST`, `RAGMON_RABBIT_USER`, `RAGMON_RABBIT_PASS`
- `RAGMON_BASIC_USER`, `RAGMON_BASIC_PASS`
- `RAGMON_DB_URL`, `RAGMON_DB_USER`, `RAGMON_DB_PASS`
