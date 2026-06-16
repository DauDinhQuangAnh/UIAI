# social-ai Console (web/)

Customer Dashboard frontend (Phase 5b — Milestone 2 complete) — a **Vite + TanStack Router** SPA over the
authenticated Dashboard API (`/api/*`). Light-mode, bold brand-forward, Vietnamese-capable. Includes 8 screens
(agents CRUD, documents + async ingest polling, knowledge graph dedup review, conversations + transcript, analytics KPIs)
with **Vitest unit tests** (7 files, 30 tests) and **Playwright e2e** (happy-path login, axe a11y).

> Stack note: the plan named "TanStack Start", but the app runs SPA-only
> (`ssr:false`) and is served same-origin from the Go gateway, so the Start
> server/SSR layer adds nothing. We use plain Vite + `@tanstack/react-router`
> (file-based) + `@tanstack/react-query` — the identical client app, fewer moving parts.

## Stack

- **Build:** Vite 6 · TypeScript (strict)
- **Routing:** `@tanstack/react-router` (file-based, `src/routes/`, generated `routeTree.gen.ts`)
- **Server state:** `@tanstack/react-query`
- **UI:** Tailwind CSS 3 + customized shadcn-style primitives (`src/components/ui/`) · **Phosphor** icons
- **Forms:** react-hook-form + zod
- **Auth store:** Zustand (Phase 2)
- **Typed API client:** `openapi-typescript` + `openapi-fetch` (Phase 2)

## Screens

The dashboard spans **8 screens** across 4 sub-routes under `/agents/{agentId}/`:

| Screen | Path | Features |
|--------|------|----------|
| **Agents** | `/agents` | Keyset list (create button), agent tile preview (name, KG toggle, last activity) |
| **Agent Detail** | `/agents/{id}` | KG toggle, retrieval range config (`embedding_lookback_days`, `vector_search_limit`) with 422-mapped feedback |
| **Documents** | `/agents/{id}/documents` | Keyset list, multipart upload, per-doc status (pending→ready/failed), optimistic polling, idempotent delete |
| **Knowledge Graph** (P5) | `/agents/{id}/knowledge` | Dedup candidate queue with status filter, explicit keep/drop action, confirm dialog, member read-only |
| **Conversations** (P6) | `/agents/{id}/conversations` | Keyset list (backward cursor), message transcript with forward cursor, pinned rolling summary, virtualized bubbles, role-styled |
| **Conversation Detail** (P6) | `/agents/{id}/conversations/{id}` | Full transcript view of selected conversation |
| **Analytics** (P6) | `/agents/{id}/analytics` | KPI cards: doc-status counts, conversation count, last activity; backend-sourced from `GET /stats` |
| **Styleguide** | `/styleguide` | Design token + UI primitive parity reference (tokens.css ↔ Tailwind) |

Sidebar agent sub-nav wires to Knowledge/Conversations/Analytics tabs.

## Testing

### Unit & Component Tests
```bash
npm test             # Vitest (jsdom, single-flight refresh, 401/403 interceptor, keyset cursors, status-chip, KG guards)
```
Covers: session store + refresh token rotation, 422 error mapping, bidirectional cursor navigation (backward list / forward transcript), entity merge/dismiss guards.

### E2E Tests
```bash
npm run e2e          # Playwright (happy-path login + agents/docs flow, axe a11y audit)
```

### Build & Type Check
```bash
npm run typecheck    # tsc --noEmit
npm run build        # tsc --noEmit && vite build  -> ../internal/gateway/spa/dist
```

## Commands

```bash
npm install          # install deps
npm run dev          # Vite dev server (proxies /api -> VITE_API_BASE_URL)
npm run build        # tsc --noEmit && vite build  -> ../internal/gateway/spa/dist
npm run typecheck    # tsc --noEmit
npm run gen:api      # regenerate src/api/schema.d.ts from ../api/openapi/dashboard.yaml
```

Copy `.env.example` → `.env` for local dev to point `/api` at your backend.

## Design system

The single source of truth is `docs/design-guidelines.md` + its style tile.
Tokens live once in `src/styles/tokens.css` (CSS vars), consumed by
`tailwind.config.ts` and the shadcn semantic contract — **no raw hex in components**.
Visit **`/styleguide`** in dev for a live token/primitive parity check.

## Serving (same-origin embed)

`npm run build` emits the SPA into `internal/gateway/spa/dist`. The Go gateway
embeds it **only** under the `embed_spa` build tag and serves it via an SPA
catch-all (non-`/api` GETs fall through to `index.html`). A default `go build`
omits the SPA — the JSON API is unaffected.

```bash
# From repo root: build SPA, then the Go binary with the SPA baked in.
cd web && npm ci && npm run build && cd ..
go build -tags embed_spa -o bin/server .
```
