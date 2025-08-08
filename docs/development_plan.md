# imc-ragmon – Development Plan (DRAFT)

This file is the living plan we will update as work completes. It includes assumptions, a phased roadmap with granular steps, and quick mockups.

## UI Framework Choice

**Chosen stack**: React (Vite + TypeScript) + Tailwind CSS + shadcn/ui + TanStack Query + ECharts

- **Why**
  - **Prettiest out-of-the-box**: shadcn/ui provides polished, modern components built on Radix.
  - **Fast dev**: Vite is extremely fast; Tailwind accelerates consistent styling.
  - **Great DX**: TanStack Query simplifies realtime/refetch caching; ECharts renders rich, performant charts.
  - **Flexible transport**: First-class support for WebSocket or Server-Sent Events (SSE) streams.

If we need a single binary later, we can package the SPA behind a Spring Boot static resources module.

## Key Assumptions & Open Questions

- Assumptions
  - `rag-stream.sh` ultimately emits events visible via RabbitMQ or a log we can bridge.
  - We will aggregate and proxy stream data through a Spring Boot service (for auth, shaping, SSE/WebSocket), rather than connecting the browser directly to AMQP.
  - Java 21, Spring Boot 3.5.4, Maven Wrapper.
  - Dev DB: H2; Prod DB: PostgreSQL.

- Open Questions (please confirm)
  1. RabbitMQ connection details (host, vhost, creds) and queue/exchange names used by the pipeline.
  2. Message schema(s) for events from `hdfsWatcher`, `textProc`, `embedProc`.
  3. Whether SCDF/Skipper controls should be exposed (start/stop/scale) or we are read-only.
  4. Security model (none/dev only, basic auth, OAuth2?).
  5. Deployment target(s): single-node demo vs multi-env.
  6. Repo initialization in this directory.

## Decisions Confirmed (by owner)

- RabbitMQ details: use the same settings as the other apps; store in properties files with env overrides.
- Message schemas: use the existing schemas from the other apps; we will document and map them.
- Scope: both monitoring and controls; surface controls with polished UI (toggles/segmented controls) for start/stop/scale.
- Security: Basic Auth; credentials come from environment variables and are bound into Spring properties at runtime.
- Deployment: single server; RAG components run independently with URLs discoverable from their first messages on the rabbit monitoring queue.
- Repo: initialize a Git repo in this project.

## Configuration Spec (initial)

- Environment variables (read by Spring and UI build as needed):
  - `RAGMON_RABBIT_HOST`, `RAGMON_RABBIT_PORT`, `RAGMON_RABBIT_VHOST`, `RAGMON_RABBIT_USER`, `RAGMON_RABBIT_PASS`
  - `RAGMON_BASIC_USER`, `RAGMON_BASIC_PASS`
  - `RAGMON_DB_URL`, `RAGMON_DB_USER`, `RAGMON_DB_PASS` (prod)
- Application properties (with sensible defaults; overridden by env):
  - `ragmon.rabbit.host`, `.port`, `.vhost`, `.username`, `.password`
  - `ragmon.security.basic.username`, `.password`
  - `spring.datasource.*` for DB profiles
  - `ragmon.stream.transport` = `sse` | `websocket`
  - `ragmon.stream.retentionWindowSeconds`

## Phased Roadmap

Status markers: [ ] not started, [~] in progress, [x] done.

### Phase 0 – Discovery & Design

- [x] Inventory `rag-stream.sh` outputs; identify event source(s) and schemas.
- [x] Confirm RabbitMQ topology (exchange, queues, routing keys).
- [x] Enumerate available Actuator endpoints for `hdfsWatcher`, `textProc`, `embedProc`.
- [x] Agree on read-only vs control (start/stop/scale) scope.
- [x] Validate security and deployment constraints.

Deliverables: finalized message schemas; finalized UI scope; transport choice (WebSocket vs SSE).

### Phase 1 – Backend Scaffolding (ragmon-api)

- [x] Create Spring Boot 3.5.4 module with Maven Wrapper and parent POM.
- [x] Add deps: `spring-boot-starter-webflux`, `spring-boot-starter-amqp`, `spring-boot-starter-actuator`, `spring-boot-starter-validation`, `springdoc-openapi-starter-webflux-ui`, `spring-boot-starter-security`, DB (H2/Postgres).
- [x] Model event DTOs; implement AMQP consumer/bridge to an internal event bus.
- [x] Expose streaming endpoint `/stream` (SSE) and REST endpoints (`/api/apps`, `/api/queues`, `/api/metrics`, `/api/events/recent`).
- [x] Persist event history (rolling window) with retention policies.
- [x] Health checks and OpenAPI docs.
- [x] Basic Auth wired from env: `RAGMON_BASIC_USER`/`RAGMON_BASIC_PASS` → `ragmon.security.basic.*`.
- [x] Properties files per profile with env override mapping for RabbitMQ and DB.
- [x] Map `pipeline.metrics` schema (from `textProc` meta) into Event model.

Deliverables: running API with synthetic events; OpenAPI UI; basic persistence.

### Phase 2 – Frontend Scaffolding (ragmon-web)

- [x] Bootstrap Vite + React + TS + Tailwind; configure ESLint/Prettier.
- [x] Layout shell: top nav, left sidebar, responsive content area (light theme).
- [x] Data layer: SSE hook; basic fetch for recent events.
- [x] Pages/Views:
  - [x] Dashboard: KPIs (counts) and recent events table.
  - [x] Live Stream: real-time table with pause/resume.
  - [x] Queues & Apps: app cards with URLs from first messages.
  - [x] Settings: connection status, notes.
- [x] Components: basic cards/tables.
- [~] Controls UI scaffold: segmented control to be wired in Phase 3.

Deliverables: polished UI consuming mock data, then live API.

### Phase 3 – Integration & Controls

- [x] Switch to real API/stream (SSE) wired.
- [x] Map `pipeline.metrics` schema fields to UI (service → app, processingState → stage, lastError → message).
- [ ] Controls: implement Start/Stop/Scale for services that expose management endpoints.
  - [ ] Discovery: show control buttons only when service advertises capability.
  - [ ] Actions: POST to service-specific endpoints or control bridge.
  - [ ] Confirmations and error toasts.
- [ ] Error handling, reconnection strategies, backpressure UX improvements.

Deliverables: end-to-end live monitoring; control actions for start/stop/scale.

### Phase 4 – Testing, Perf, and Docs

- [ ] Unit tests (API and UI), contract tests for event schema.
- [ ] Load tests for stream; verify UI smoothness at target EPS.
- [ ] Accessibility pass; keyboard shortcuts (pause, filter focus).
- [ ] Documentation updates (see docs hierarchy below).

Deliverables: green CI, performance report, updated docs.

### Phase 5 – Packaging & Deployment

- [ ] Package SPA with API or deploy separately behind reverse proxy.
- [ ] Profiles: `dev` (H2, no auth), `prod` (Postgres, auth).
- [ ] Versioning and releases.

Deliverables: runnable artifact(s) and deployment notes.

## Mockups (Quick)

Data flow:

```mermaid
graph LR
  A[RabbitMQ] -- AMQP --> B[ragmon-api (Spring Boot)]
  B -- WebSocket / SSE --> C[ragmon-web (React SPA)]
  B -- REST (metrics) --> C
  B -- JPA --> D[(H2 / Postgres)]
```

Dashboard wireframe (conceptual layout):

```
┌──────────────────────────────────────────────────────────────┐
│ Top Nav: imc-ragmon   [Connection: OK]   [Theme]   [Settings] │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ KPI Cards:  Throughput | Backlog | ErrorRate │
│ - Dashboard   ├──────────────────────────────────────────────┤
│ - Live Stream │ Charts:  Events/sec (line)   Errors (bar)    │
│ - Queues      ├──────────────────────────────────────────────┤
│ - Apps        │ Recent Events (table, last N with severity)  │
│ - Settings    │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

Live Stream view:

```
┌──────────────────────────────────────────────────────────────┐
│ Live Stream   [Pause] [Auto-scroll] [Filter: app/stage/sev]  │
├──────────────────────────────────────────────────────────────┤
│ Timestamp | App | Stage | DocId | Latency | Status | Message │
│ … autoupdating rows …                                        │
└──────────────────────────────────────────────────────────────┘
```

Queues & Apps:

```
┌─────────────── Queues ───────────────┐  ┌──────────── Apps ────────────┐
│ Name | Depth | In/s | Out/s | Cons.  │  │ App | Instances | Health     │
│  ...                                  │  │ ...                          │
└───────────────────────────────────────┘  └──────────────────────────────┘
```

## Documentation Hierarchy (to maintain)

- `docs/mental_model.md`: conceptual architecture and data flow.
- `docs/implementation_details.md`: technical decisions, API shapes, message schemas.
- `docs/gotchas.md`: issues, edge cases, mitigations.
- `docs/quick_reference.md`: commands, configs, endpoints, ports.

We will update these alongside code changes per process.

## Risks & Mitigations

- High event rates → use windowed rendering, virtualization, and SSE/WebSocket backpressure handling.
- Unstable broker → reconnection with exponential backoff; UI banners on degraded mode.
- Unknown schemas → start with tolerant DTOs and evolve with contract tests.

## Next Steps (Awaiting Approval)

- Proceed with Phase 0 discovery tasks and scaffold `ragmon-api` and `ragmon-web` (additive only).
- Initialize repository and commit plan/docs.


