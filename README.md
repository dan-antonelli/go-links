# go-links

Internal go-links service. Register short slugs like `go/docs` that redirect to real URLs.

Transport-agnostic domain core, with HTTP and CLI as thin adapters. OpenTelemetry wired in as cross-cutting.

## Run

```bash
npm install

# dev server, auto-restart
npm run dev

# build + run compiled
npm run build
npm start

# tests
npm test
```

Server listens on `http://localhost:3000` by default. Override with `PORT`.

## CLI

```bash
npm run cli -- add docs https://example.com/docs
npm run cli -- ls
npm run cli -- rm docs
```

Point at a different server with `GOLINKS_API_URL` (defaults to `http://localhost:3000`):

```bash
GOLINKS_API_URL=http://golinks.internal:3000 npm run cli -- ls
```

After `npm run build`, `npm link` gives you a global `golinks` command.

## API

```
POST   /api/links        create {slug, url}
GET    /api/links        list
GET    /:slug            302 redirect
DELETE /api/links/:slug  remove
GET    /health           liveness
```

Full spec in `openapi.yaml`.

## Assumptions

- Single instance, single process. No multi-instance coordination.
- In-memory store. Restart wipes all links.
- Slug is the unique key, no separate id.

## Tradeoffs and cuts

First iteration, not a finished product. Cut on purpose, to move fast:

- In-memory store (a `Map`). No persistence.
- No auth. Anyone who can reach it can create, list, delete, and resolve links.
- No database. `Store` interface exists so a real one can drop in later without touching the domain or the adapters.
- No web UI. API and CLI only.
- No Docker, no CI.
- Console OTel exporter. Traces and metrics print to stdout, nothing shipped to a collector.

## If I had another day

- Swap `InMemoryStore` for a `SqliteStore` or `PostgresStore` behind the same `Store` interface. Nothing else changes.
- Swap console exporters for OTLP, point at a real collector.
- CLI auth and config, an API key or a `~/.golinksrc`.
- Rate limit the redirect route.
- Web UI as a thin layer over the existing `/api/links` endpoints.

## Observability

- Traces: instrumentation scoped to `http` and `express` only, printed via `ConsoleSpanExporter`. No runtime metrics (v8, event loop, heap) and no cloud resource detectors, just request spans. Set `OTEL_SERVICE_NAME=golinks` so traces show a real service name instead of the SDK default.
- Metrics: two counters, `golinks.redirects` and `golinks.links.created`, exported every 10s via `ConsoleMetricExporter`.
- Logs: structured pino JSON. Every request gets a `requestId` (from `x-request-id` header, or generated), echoed in the response header and in every error body, so you can trace a client error back to server logs and spans.
