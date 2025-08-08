# Implementation Details

## Backend (ragmon-api)

- Java 21, Spring Boot 3.5.4 (parent POM) with Maven Wrapper
- Starters: WebFlux, AMQP, Actuator, Validation, Security (Basic), JPA, WebSocket (if chosen over SSE)
- Transport: default SSE (WebFlux), optional WebSocket (configurable via `ragmon.stream.transport`)
- Persistence: rolling event history via H2 (dev) / Postgres (prod) with retention
- OpenAPI via springdoc (path `/swagger-ui`)

### Configuration

Environment variables (recommended):
- `RAGMON_RABBIT_HOST`, `RAGMON_RABBIT_PORT`, `RAGMON_RABBIT_VHOST`, `RAGMON_RABBIT_USER`, `RAGMON_RABBIT_PASS`
- `RAGMON_BASIC_USER`, `RAGMON_BASIC_PASS`
- `RAGMON_DB_URL`, `RAGMON_DB_USER`, `RAGMON_DB_PASS` (prod)

Properties (application.yml) with env overrides:

```yaml
ragmon:
  rabbit:
    host: ${RAGMON_RABBIT_HOST:localhost}
    port: ${RAGMON_RABBIT_PORT:5672}
    vhost: ${RAGMON_RABBIT_VHOST:/}
    username: ${RAGMON_RABBIT_USER:guest}
    password: ${RAGMON_RABBIT_PASS:guest}
  security:
    basic:
      username: ${RAGMON_BASIC_USER:admin}
      password: ${RAGMON_BASIC_PASS:admin}
  stream:
    transport: ${RAGMON_STREAM_TRANSPORT:sse}   # sse|websocket
    retentionWindowSeconds: ${RAGMON_RETENTION_SECONDS:600}

spring:
  datasource:
    url: ${RAGMON_DB_URL:jdbc:h2:mem:ragmon;DB_CLOSE_DELAY=-1}
    username: ${RAGMON_DB_USER:sa}
    password: ${RAGMON_DB_PASS:}
  jpa:
    hibernate:
      ddl-auto: update
```

### Security
- Basic Auth enforced for all API routes; UI will send credentials.
- In dev, use defaults; in prod, set secrets via env.

### AMQP Consumer → Internal Bus → Stream
- Consumers per app routing key map into normalized event DTO:
  - `app`, `stage`, `docId`, `timestamp`, `latencyMs`, `status`, `message`, `urls` (optional, discovered first message)
- Server caches recent N seconds for metrics and initial page load.

## Frontend (ragmon-web)

- Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query + ECharts
- State/data: Query for REST, custom hook for SSE/WebSocket
- Components: KPI cards, charts, virtualized live table, controls (segmented buttons, toggles, modals)

### Auth
- Use Basic Auth; store credentials in memory only (no localStorage). Prompt once per session.

### Controls
- Start/Stop/Scale exposed as enabled controls only if server reports capability
- Confirmations for destructive actions; undo where applicable

## Packaging
- Option A: Serve SPA from Spring Boot `src/main/resources/static`
- Option B: Deploy separately behind reverse proxy; configure CORS for API
