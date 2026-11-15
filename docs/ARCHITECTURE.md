# Architecture — CIVICSAATHI AI

**Status:** Day 1 foundation complete · **Version:** 0.1.0
**Last updated:** 15 November 2026

This document explains how the Day 1 system is put together, which boundaries
exist for later milestones, and why the trust-critical decisions were made.
It is the reference for extending the project without weakening its guarantees.

---

## 1. Scope

### Built on Day 1

- A public landing page explaining the problem, workflow and evidence model.
- A responsive workspace shell with live backend telemetry.
- A FastAPI service with liveness, readiness and product metadata endpoints.
- A read-only scheme repository over a valid, intentionally empty dataset.
- Typed configuration, CORS, logging and a consistent error envelope.
- Automated backend tests, frontend lint and a production build.

### Deliberately not built yet

- Scheme catalogue and search (Day 2).
- Deterministic eligibility evaluation (Day 2).
- Supabase persistence (Day 2).
- PDF upload, extraction and vector indexing (Day 3).
- Gemini answers and citation rendering (Day 4).
- Authentication and user accounts (not required for the hackathon MVP).

The UI labels every unbuilt module with its milestone. No endpoint pretends to
exist and no scheme data is fabricated to fill space.

---

## 2. Design principles

1. **Trust before fluency.** A boring correct answer beats a confident wrong
   one. Eligibility is computed by code. The LLM may explain, never decide.
2. **Deterministic core, probabilistic periphery.** Rules, data retrieval and
   citation assembly are deterministic. Language generation is the only
   probabilistic step, and it is constrained by retrieved evidence.
3. **Honest states.** Empty data is `pending`. Missing credentials are
   `not_configured`. A failed check is `error`. Nothing is silently green.
4. **Server-owned secrets.** API keys live only in backend environment
   variables. `VITE_*` values are public by definition.
5. **Seam-first data access.** Routes never read JSON directly. A repository
   boundary lets Day 2 swap the storage provider without changing the API
   contract or the UI.
6. **Progressive disclosure.** The workspace is usable on Day 1, while later
   capabilities show what is coming and what it will require.

---

## 3. System context

```text
┌──────────────┐        HTTPS / JSON        ┌─────────────────────────┐
│   Citizen    │ ─────────────────────────► │  React web application  │
│  EN / ML     │ ◄───────────────────────── │  Vercel (planned)       │
└──────────────┘                            └───────────┬─────────────┘
                                                        │ REST /api/v1
                                                        ▼
                                            ┌─────────────────────────┐
                                            │  FastAPI service        │
                                            │  Render (planned)       │
                                            │                         │
                                            │  health · readiness     │
                                            │  system · schemes       │
                                            │  eligibility · RAG      │
                                            └───────┬─────────┬───────┘
                                                    │         │
                         ┌──────────────────────────┘         └──────────────────┐
                         ▼                                                       ▼
            ┌────────────────────────┐                              ┌────────────────────────┐
            │ Day 1: JSON repository │                              │ Planned integrations   │
            │ Day 2+: Supabase       │                              │ Gemini · ChromaDB      │
            │ PostgreSQL             │                              │ PyMuPDF                │
            └────────────────────────┘                              └────────────────────────┘
```

The browser never talks to Supabase, Gemini or ChromaDB directly. Every
privileged operation goes through the API, which keeps credentials and policy
enforcement on the server.

---

## 4. Runtime topology (development)

| Component | Location | Port | Command |
| --- | --- | --- | --- |
| FastAPI | `backend/` | 8000 | `python -m uvicorn app.main:app --reload` |
| Vite dev server | `frontend/` | 5173 | `npm run dev` |
| JSON dataset | `data/sample_schemes/schemes.json` | — | Read at request time |
| Local vector store | `backend/.chroma` (planned) | — | Created on first ingestion |

The frontend defaults to `http://127.0.0.1:8000`. CORS allows
`http://localhost:5173` and `http://127.0.0.1:5173` in development. Both are
configurable and must be updated for deployment.

---

## 5. Frontend architecture

### 5.1 Routes

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `LandingPage` | Public product narrative and bilingual answer preview |
| `/app` | `DashboardPage` | Live workspace overview |
| `/app/schemes` | `ModulePreviewPage` | Day 2 module preview |
| `/app/eligibility` | `ModulePreviewPage` | Day 2 module preview |
| `/app/documents` | `ModulePreviewPage` | Day 3 module preview |
| `/app/assistant` | `ModulePreviewPage` | Day 4 module preview |
| `*` | `NotFoundPage` | Route-level 404 |

`AppShell` wraps all `/app/*` routes and owns the persistent sidebar, topbar,
mobile drawer and backend snapshot. `useOutletContext()` passes the snapshot to
dashboard and preview pages without a global state library.

### 5.2 Layers

```text
pages/            route-level composition
components/       reusable visual and layout primitives
hooks/            stateful browser/API behaviour
services/api.js   HTTP boundary and error normalization
data/modules.js   static product copy and milestone metadata
index.css         design tokens, fonts, motion policy
```

There is no global store on Day 1. The only shared state is the backend
snapshot, which is scoped to the workspace. This keeps the foundation small and
makes the Day 2 data screens easy to add.

### 5.3 Snapshot flow

```text
AppShell
  └── useSystemSnapshot()
        ├── getHealth()                  required
        ├── getReadiness()               best effort ┐ Promise.allSettled
        ├── getSystemInfo()              best effort ┘
        ├── poll every 30 s while visible
        └── refresh on visibilitychange
```

- Health failure sets `status: "error"` and preserves the previous snapshot so
  stale readiness data is never presented as current.
- Readiness or metadata failure does not take down the dashboard; the affected
  card shows an unavailable state.
- Every request carries a monotonically increasing request ID. Late responses
  from an older poll are discarded.
- `document.visibilityState` prevents background polling and triggers an
  immediate refresh when the tab returns.

### 5.4 Failure states

| State | UI behaviour |
| --- | --- |
| Initial load | Skeleton cards, "Connecting" status |
| API unreachable | Offline banner, "Unreachable" status, retry button, setup hint |
| Timeout (>12 s) | Actionable timeout message with API URL |
| Readiness unavailable | Readiness card explains the check could not be loaded |
| Partial data | Last good snapshot is retained, marked with its last-checked time |
| Unknown route | 404 page with a route back to the workspace |

### 5.5 Design system

Tokens in `src/index.css` define the civic navy (`ink-*`) and teal (`brand-*`)
palettes, Instrument Serif display type, Inter UI type and Noto Sans Malayalam.
`shadow-soft` and `shadow-lift` provide elevation. Motion is subtle and
disabled under `prefers-reduced-motion`.

The layout is verified at 1440 px and 390 px with zero horizontal overflow.
The marketing header collapses to a menu at `md`; the workspace sidebar becomes
a drawer at `lg`. The drawer traps attention with an overlay, closes on Escape,
and locks background scroll.

Accessibility details are listed in [`frontend/README.md`](../frontend/README.md).

---

## 6. Backend architecture

### 6.1 Module layout

```text
app/main.py                 FastAPI app, CORS, lifespan, 500 handler
app/core/config.py          Typed settings, cached per process
app/core/logging.py         Logging configuration
app/routes/health.py        GET /health, GET /health/readiness
app/routes/system.py        GET /system/info
app/services/system_service.py
                            Health, readiness, feature registry, disclaimer
app/database/scheme_repository.py
                            Read-only dataset adapter and status
app/models/schemas.py       Pydantic response contract
```

### 6.2 Request lifecycle

1. Uvicorn starts the app and runs the lifespan hook.
2. The hook stores `started_at` and a `SchemeRepository` instance on
   `app.state`.
3. A request enters a thin route handler.
4. The handler calls a service function with settings and, where needed,
   repository state.
5. Pydantic validates and serializes the response model.
6. Unexpected exceptions are logged by the global handler and returned as a
   generic error envelope without internal details.

### 6.3 Why lifespan state

The repository and start time are process-scoped, not request-scoped. Creating
them once in the lifespan hook avoids repeated file I/O, makes health uptime
accurate, and gives tests a controlled startup/shutdown boundary through
`TestClient` as a context manager.

### 6.4 Configuration

`Settings` is a `pydantic-settings` model loaded from `backend/.env` and cached
with `lru_cache`. It exposes normalized CORS origins and boolean helpers
(`gemini_configured`, `supabase_configured`). Secrets use `SecretStr` and are
never included in responses or logs.

### 6.5 Error contract

Unhandled exceptions return HTTP 500:

```json
{
  "detail": "An unexpected error occurred. Please try again.",
  "code": "internal_error"
}
```

The client turns any unexpected response into an `ApiError` with a readable
message. Known 4xx responses keep FastAPI's `detail` string when present.

---

## 7. API contract

### 7.1 Endpoints

| Method | Path | Dependencies | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | None | Service name, version, docs and health links |
| `GET` | `/api/v1/health` | None | Liveness, environment, uptime |
| `GET` | `/api/v1/health/readiness` | Dataset, settings | Dependency truth table |
| `GET` | `/api/v1/system/info` | Settings | Languages, features, disclaimer |

`/health` must remain cheap and independent of external services so that a
platform liveness probe reflects the process, not a third party.

### 7.2 Readiness semantics

Each check has one of four states:

| State | Meaning | Example |
| --- | --- | --- |
| `ok` | Verified and usable | API responding; dataset contains records |
| `pending` | Planned, not built yet | ChromaDB before Day 3 |
| `not_configured` | Required credentials absent | Supabase URL/key empty |
| `error` | Expected to work but failed | Dataset file missing or invalid |

Aggregation:

```text
any check == "error"        → overall "not_ready"
all checks == "ok"          → overall "ready"
anything else               → overall "degraded"
```

On Day 1 the expected result is `degraded`:

- API is `ok`.
- Dataset is `pending` because it contains zero schemes.
- Supabase is `not_configured` unless credentials are supplied.
- Gemini is `not_configured` or `pending` depending on credentials.
- ChromaDB is `pending` until Day 3.

This is intentionally visible in the dashboard. A green dashboard on Day 1
would be a lie.

### 7.3 Planned contracts

These are design targets, not implemented endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/v1/schemes` | Search, category and beneficiary filters |
| `GET` | `/api/v1/schemes/{id}` | Full record with source and verification date |
| `POST` | `/api/v1/eligibility/check` | Structured profile → per-rule results |
| `POST` | `/api/v1/documents` | Multipart PDF upload and ingestion |
| `GET` | `/api/v1/documents/{id}` | Document metadata and ingestion status |
| `POST` | `/api/v1/assistant/query` | Question + language → grounded answer + citations |

---

## 8. Data architecture

### 8.1 Day 1 provider

`SchemeRepository` reads `data/sample_schemes/schemes.json` at request time and
reports:

- `available: false` when the file is missing, unreadable or malformed.
- `scheme_count: 0` with `pending` when the file is valid but empty.
- `ok` once curated records exist.

The dataset is valid JSON with an empty `schemes` array. The repository accepts
either `{ "schemes": [...] }` or a bare array to keep the import format
flexible.

### 8.2 Trust policy for records

The rules in [`data/sample_schemes/README.md`](../data/sample_schemes/README.md)
are normative:

1. Official government source only.
2. No invented schemes or benefits.
3. Every record stores source URL, verification date and source title.
4. Demo records set `is_demo: true` and are labelled in the UI.

The planned record shape keeps English and Malayalam fields side by side,
along with benefits, eligibility summary, required documents, application
steps, department and provenance.

### 8.3 Why JSON first

- The API and UI can be built without external credentials.
- Demos stay reproducible if the network or database is unavailable.
- The repository interface is the seam for Supabase, so the replacement does
  not touch routes or response models.
- An empty dataset is an honest signal rather than a blocker.

---

## 9. Planned architecture

### 9.1 Day 2 — Supabase and deterministic eligibility

```text
citizen profile
      │
      ▼
POST /eligibility/check
      │
      ▼
EligibilityService
      ├── load candidate schemes (repository / Supabase)
      ├── for each rule: evaluate(profile, rule)
      │     ├── pass
      │     ├── fail
      │     └── unknown  (missing profile field)
      └── build explanation per rule
      │
      ▼
{ eligible: [...], ineligible: [...], needs_info: [...] }
```

- Rules are stored as data: field, operator, value and human-readable reason.
- Evaluation is pure Python, unit-tested against boundary cases.
- The response distinguishes "not eligible" from "cannot determine yet".
- Gemini is not called in this flow.

### 9.2 Day 3 — document intelligence

```text
PDF upload
  → validate type/size
  → PyMuPDF page extraction
  → clean and chunk (overlap, page metadata)
  → embeddings
  → ChromaDB collection
  → document metadata in Supabase
```

Every chunk retains `document_id`, file name, page number and character range.
Those fields are what make citations possible later.

### 9.3 Day 4 — evidence-backed assistant

```text
question + language
  → embed question
  → retrieve top-k chunks
  → relevance threshold
      ├── no evidence → explicit "not found in the uploaded documents"
      └── evidence    → Gemini prompt constrained to excerpts
                        → answer + validated citations
```

Guardrails:

- The prompt treats document text as data, not instructions.
- The model may only use retrieved excerpts.
- Citations are assembled and validated by code against the retrieved chunk
  metadata, not invented by the model.
- If citation validation fails, the answer is rejected or downgraded to the
  no-evidence response.
- Eligibility questions are routed to the deterministic engine, not answered
  by the LLM.

### 9.4 Day 5–7 — bilingual polish, hardening, deployment

- Complete Malayalam UI copy and language persistence.
- Evaluation set of questions with expected evidence pages.
- Failure-mode tests: missing PDF, scanned PDF, empty retrieval, Gemini outage.
- Accessibility and performance passes.
- Vercel (frontend) and Render (backend) deployment with production CORS.

---

## 10. Security and privacy

| Concern | Day 1 control | Planned control |
| --- | --- | --- |
| API keys | Server-side `.env`, `SecretStr`, gitignored | Same; rotate keys before demo |
| Browser bundle | Only `VITE_API_BASE_URL` | Never add secrets to `VITE_*` |
| CORS | Explicit development origins | Production frontend origin only |
| Supabase | Not connected | Service role used only on the server |
| Uploads | None | Type/size limits, safe filenames, no public bucket |
| PII | No accounts, no profiles stored | Minimize profile retention; document policy |
| Errors | Generic 500 envelope, server-side logs | Add request IDs and rate limits |
| Auth | None (public demo) | Out of scope for MVP; note in demo |

The workspace is a public demo on Day 1. It collects no personal data. When the
eligibility form arrives, the team should decide what is held in memory versus
persisted before collecting income or identity details.

---

## 11. Reliability and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Backend down | Axios network error | Offline banner, retry, last snapshot preserved |
| Slow API | 12 s timeout | Timeout message with configured base URL |
| Dataset missing | Repository status | Readiness `error`, API still serves health |
| Dataset empty | Record count | Readiness `pending`, dashboard shows degraded |
| Invalid JSON | Parse exception | Readiness `error`, details logged |
| Missing Gemini key | Settings check | Readiness `not_configured`, AI features disabled |
| Missing Supabase key | Settings check | `not_configured`, JSON provider remains active |
| Chroma not built | Static check | `pending` until ingestion exists |
| Unhandled exception | Global handler | Logged with traceback, generic 500 to client |
| Stale poll response | Request ID | Discarded |
| Background tab | Visibility API | Polling paused, immediate refresh on return |

---

## 12. Testing strategy

### Day 1

- `backend/tests/test_api.py` uses `TestClient` with the lifespan context.
- Covers health, readiness check IDs, bilingual system info, CORS and 404.
- Ruff enforces Python lint; Oxlint enforces frontend lint.
- Vite production build catches import and bundling errors.
- Manual browser verification at 1440 px and 390 px, including offline mode,
  Malayalam preview, mobile navigation and 404.

### Planned

- Unit tests for every eligibility operator and boundary.
- Repository contract tests shared by JSON and Supabase providers.
- Ingestion tests with representative official PDFs, including scanned files.
- Retrieval evaluation with expected page hits.
- Citation validation tests for missing or mismatched evidence.
- End-to-end smoke test for the demo path.

---

## 13. Deployment topology (planned)

```text
GitHub
  ├── Vercel  ← frontend/  (static build, SPA routing)
  └── Render  ← backend/   (Python 3.12, uvicorn)
                     │
                     ├── Supabase PostgreSQL
                     ├── ChromaDB persistent disk (or managed vector store)
                     └── Google Gemini API
```

Configuration requirements:

- `VITE_API_BASE_URL` points at the Render service.
- `CORS_ORIGINS` contains only the deployed frontend origin.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are Render environment
  secrets, never repository variables.
- Chroma persistence must use a mounted disk on Render, or be replaced with a
  managed vector store if the instance is ephemeral.
- Health checks should target `/api/v1/health`; readiness is for dashboards and
  operators, not platform restarts.

---

## 14. Decision log

| Decision | Why | Trade-off |
| --- | --- | --- |
| JSON repository on Day 1 | No credentials, reproducible demos, fast foundation | Manual import until Supabase lands |
| Empty dataset instead of samples | Never fabricate official scheme data | Dashboard starts degraded |
| Health and readiness split | Liveness must not depend on third parties | Two endpoints to maintain |
| Deterministic eligibility | Trust and auditability | Rules must be curated and tested |
| Evidence-first RAG | Citations are the product differentiator | More ingestion work, stricter prompts |
| Secrets only on the server | Browser bundles are public | All privileged calls go through the API |
| 30 s polling instead of websockets | Simple, adequate for an operations dashboard | Slight staleness; acceptable |
| No global state library | Small surface area on Day 1 | Revisit when module state grows |

---

## 15. Day 2 extension points

Start here when Day 1 is approved:

1. Add curated, source-linked records to `data/sample_schemes/schemes.json`.
2. Introduce `SchemeRepository` methods for list/detail, then a Supabase
   implementation behind the same interface.
3. Add Pydantic models for scheme records and `GET /api/v1/schemes`.
4. Add the rules data model and pure evaluator in `app/services/`.
5. Add `POST /api/v1/eligibility/check` with per-rule explanations.
6. Replace the two Day 2 preview pages with real list/detail and form screens.
7. Extend tests for search, rule boundaries and missing profile fields.

Do not add Gemini to the eligibility path. The LLM can explain a completed
evaluation, but the decision must remain code-owned and reproducible.
