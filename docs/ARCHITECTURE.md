# Architecture — CIVICSAATHI AI

**Status:** Day 2 complete · **Version:** 0.2.0
**Last updated:** 17 November 2026

This document explains how the system is put together, which boundaries exist
for later milestones, and why the trust-critical decisions were made. It is the
reference for extending the project without weakening its guarantees.

---

## 1. Scope

### Built by Day 2

- A public landing page and a responsive trilingual workspace shell.
- A FastAPI service with liveness, readiness and product metadata endpoints.
- A curated, Pydantic-validated dataset of 15 central and Kerala schemes,
  each with official sources and a verification date.
- `GET /api/v1/schemes` with name/keyword search, category and government-level
  filters, and pagination.
- `GET /api/v1/schemes/{id}` with benefits, documents, application steps,
  encoded conditions and every official source.
- `POST /api/v1/eligibility/check`: a deterministic, three-valued rules engine
  with per-condition and per-route explanations.
- An official-source URL allowlist with a recorded rationale per domain.
- Live frontend catalogue, detail and eligibility screens in English,
  Malayalam and Hindi, with loading, empty, error and not-found states.
- Backend unit/API/boundary tests, Ruff, Oxlint and a production build.

### Deliberately not built yet

- Supabase persistence. Deferred beyond Day 2; the JSON repository is the
  active provider and the seam for a future database implementation.
- PDF upload, extraction and vector indexing (Day 3).
- Gemini answers and citation rendering (Day 4).
- Voice input and agent workflows.
- Authentication and user accounts (not required for the hackathon MVP).

The UI labels every unbuilt module with its milestone. Documents and the
assistant remain honest previews; scheme discovery and eligibility are live.

---

## 2. Design principles

1. **Trust before fluency.** A boring correct answer beats a confident wrong
   one. Eligibility is computed by code. The LLM may explain, never decide.
2. **Deterministic core, probabilistic periphery.** Rules, retrieval and
   citation assembly are deterministic. Language generation is the only
   probabilistic step, and it is constrained by retrieved evidence.
3. **Honest states.** Empty data is `pending`. Missing credentials are
   `not_configured`. A failed check is `error`. A missing answer is `unknown`.
   Nothing is silently green and no field is guessed.
4. **Server-owned secrets.** API keys live only in backend environment
   variables. `VITE_*` values are public by definition.
5. **Seam-first data access.** Routes never read JSON directly. A repository
   boundary keeps the API contract stable if storage changes.
6. **Progressive disclosure.** The workspace shows what is live, what is a
   preview and what each preview will require.

---

## 3. System context

```text
┌──────────────┐        HTTPS / JSON        ┌─────────────────────────┐
│   Citizen    │ ─────────────────────────► │  React web application  │
│ EN / ML / HI │ ◄───────────────────────── │  Vercel (planned)       │
└──────────────┘                            └───────────┬─────────────┘
                                                        │ REST /api/v1
                                                        ▼
                                            ┌─────────────────────────┐
                                            │  FastAPI service        │
                                            │  Render (planned)       │
                                            │                         │
                                            │  health · readiness     │
                                            │  system · schemes       │
                                            │  eligibility            │
                                            └───────┬─────────┬───────┘
                                                    │         │
                         ┌──────────────────────────┘         └──────────────────┐
                         ▼                                                       ▼
            ┌────────────────────────┐                              ┌────────────────────────┐
            │ Day 2: JSON repository │                              │ Planned integrations   │
            │ Supabase (deferred)    │                              │ Gemini · ChromaDB      │
            │                        │                              │ document extraction    │
            └────────────────────────┘                              └────────────────────────┘
```

The browser never talks to a database, Gemini or ChromaDB directly. Every
privileged operation goes through the API, which keeps credentials and policy
enforcement on the server.

---

## 4. Runtime topology (development)

| Component | Location | Port | Command |
| --- | --- | --- | --- |
| FastAPI | `backend/` | 8000 | `python -m uvicorn app.main:app --reload` |
| Vite dev server | `frontend/` | 5173 | `npm run dev` |
| Curated dataset | `data/sample_schemes/schemes.json` | — | Read once and cached per process |
| Local vector store | `backend/.chroma` (planned) | — | Created on first ingestion |

The frontend defaults to `http://127.0.0.1:8000`. CORS allows
`http://localhost:5173` and `http://127.0.0.1:5173` in development. Both are
configurable and must be updated for deployment.

---

## 5. Frontend architecture

### 5.1 Routes

| Route | Component | Purpose |
| --- | --- | --- |
| `/` | `LandingPage` | Public product narrative, live/preview service labels |
| `/app` | `DashboardPage` | Live workspace overview and readiness |
| `/app/schemes` | `SchemesPage` | Live searchable, filterable catalogue |
| `/app/schemes/:schemeId` | `SchemeDetailPage` | Live verified scheme record |
| `/app/eligibility` | `EligibilityPage` | Live optional form and rule-based results |
| `/app/documents` | `DocumentsPage` | Day 3 preview |
| `/app/assistant` | `AssistantPage` | Day 4 preview |
| `*` | `NotFoundPage` | Route-level 404 |

`AppShell` wraps all `/app/*` routes and owns the persistent sidebar, topbar,
mobile drawer and backend snapshot. `useOutletContext()` passes the snapshot to
the dashboard without a global state library.

### 5.2 Layers

```text
pages/            route-level composition and request state
components/       reusable visual and layout primitives
hooks/            stateful browser/API behaviour
services/api.js   HTTP boundary, cancellation and error normalization
lib/format.js     locale-aware date and number formatting
data/modules.js   static product copy and milestone metadata
i18n/             EN/ML/HI catalogs and language persistence
index.css         design tokens, fonts, motion policy
```

There is still no global store. Catalogue state is local to `SchemesPage`;
detail state is local to `SchemeDetailPage`; eligibility answers and results are
local to `EligibilityPage`. This keeps sensitive eligibility answers out of
shared application state.

### 5.3 API boundary

`services/api.js` wraps Axios and exposes `getHealth`, `getReadiness`,
`getSystemInfo`, `getSchemes`, `getScheme` and `checkEligibility`.

- Every list/detail request carries the current interface language.
- Empty and undefined query parameters are dropped before the request.
- Search requests are debounced by 350 ms and aborted when replaced.
- `toApiError` normalizes network, timeout, cancellation, 404, validation and
  server errors into one `ApiError` shape with a readable message.
- Cancellation is explicitly ignored by pages so an aborted request does not
  flash an error state.
- Eligibility requests are never retried automatically and never persisted in
  browser storage.

### 5.4 Live screens

**Catalogue.** Debounced search, all nine categories, three government-level
chips, 12-per-page pagination, skeleton loading, refreshing state that keeps the
previous page visible, empty state with a filter reset, error state with retry,
and a notice when the API returns an empty-result message. Each card shows the
category, government level, summary, benefit highlights, department,
verification date and primary source link.

**Detail.** Loading skeleton, distinct 404 and generic error states, complete
record sections, manual-condition warning, primary and additional sources,
content note and disclaimer, plus an eligibility call to action.

**Eligibility.** A 29-field optional form grouped into five sections. Numeric
fields are validated locally (whole numbers, age 0–120, non-negative money) and
invalid values block submission. Blank answers are omitted from the payload so
the engine records `unknown` rather than guessing. Boolean questions use a
tri-state yes / no / not sure control. Results show outcome counts and filters,
per-condition pass/fail/unknown explanations, per-route combination status,
sources, verification dates and the preliminary-result disclaimer. The page
re-runs the check when the interface language changes.

Documents and the assistant are still previews and are labelled as such in the
sidebar, dashboard and landing page.

### 5.5 Snapshot flow

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

### 5.6 Failure states

| State | UI behaviour |
| --- | --- |
| Initial catalogue load | Skeleton cards while the first page loads |
| Catalogue refresh | Previous page retained with reduced opacity and `aria-busy` |
| API unreachable | Error notice with the API message, retry button |
| Empty search result | Empty state with a clear-filters action |
| Scheme id not found | Dedicated 404 state with a route back to the catalogue |
| Invalid eligibility answer | Inline field error and focus on the first invalid field |
| Eligibility request failure | Error notice with retry, no result retained as current |
| Partial health snapshot | Last good snapshot retained, marked with its last-checked time |
| Unknown route | 404 page with a route back to the workspace |

### 5.7 Design system

Tokens in `src/index.css` define the civic navy (`ink-*`) and teal (`brand-*`)
palettes, Instrument Serif display type, Inter UI type, Noto Sans Malayalam and
Noto Sans Devanagari. `shadow-soft` and `shadow-lift` provide elevation. Motion
is subtle and disabled under `prefers-reduced-motion`.

The layout is verified at 1440 px and 390 px with zero horizontal overflow.
The marketing header collapses to a menu at `md`; the workspace sidebar becomes
a drawer at `lg`. The drawer traps attention with an overlay, closes on Escape,
and locks background scroll.

---

## 6. Backend architecture

### 6.1 Module layout

```text
app/main.py                 FastAPI app, CORS, lifespan, 500/503 handlers
app/core/config.py          Typed settings, cached per process
app/core/logging.py         Logging configuration
app/core/source_policy.py   HTTPS official-source allowlist and rationale
app/routes/health.py        GET /health, GET /health/readiness
app/routes/system.py        GET /system/info
app/routes/schemes.py       GET /schemes, GET /schemes/{id}
app/routes/eligibility.py   POST /eligibility/check
app/services/system_service.py
                            Health, readiness, feature registry, disclaimer
app/services/scheme_service.py
                            Localised list/detail responses and notices
app/services/eligibility_engine.py
                            Three-valued DNF evaluator, pure functions
app/services/eligibility_service.py
                            In-memory evaluation over all schemes
app/database/scheme_repository.py
                            Validated read-only dataset adapter, search
app/models/schemes.py       Dataset, API and eligibility contracts
app/models/schemas.py       Health, readiness and system contracts
```

### 6.2 Request lifecycle

1. Uvicorn starts the app and runs the lifespan hook.
2. The hook stores `started_at` and a `SchemeRepository` instance on
   `app.state`.
3. A request enters a thin route handler.
4. The handler calls a service function with repository state and validated
   query/request parameters.
5. Pydantic validates and serializes the response model.
6. Dataset failures return a 503 `dataset_unavailable` envelope. Unexpected
   exceptions are logged by the global handler and returned as a generic 500
   envelope without internal details.

The repository validates the whole dataset with Pydantic on first load and
caches it. A malformed record is a deployment error, not something the API
patches at request time.

### 6.3 Why lifespan state

The repository and start time are process-scoped, not request-scoped. Creating
them once in the lifespan hook avoids repeated file I/O, makes health uptime
accurate, and gives tests a controlled startup/shutdown boundary through
`TestClient` as a context manager.

### 6.4 Configuration

`Settings` is a `pydantic-settings` model loaded from `backend/.env` and cached
with `lru_cache`. It exposes normalized CORS origins, the dataset path and
boolean helpers (`gemini_configured`, `supabase_configured`). Secrets use
`SecretStr` and are never included in responses or logs.

### 6.5 Error contract

Dataset unavailable:

```json
{ "detail": "Curated dataset file is missing.", "code": "dataset_unavailable" }
```

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

### 7.1 Implemented endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service name, version, docs and health links |
| `GET` | `/api/v1/health` | Liveness, environment, uptime |
| `GET` | `/api/v1/health/readiness` | Dependency truth table |
| `GET` | `/api/v1/system/info` | Languages, features, disclaimer |
| `GET` | `/api/v1/schemes` | Search, filter and paginate the catalogue |
| `GET` | `/api/v1/schemes/{id}` | Read one full verified record |
| `POST` | `/api/v1/eligibility/check` | Evaluate all schemes in memory |

`/health` remains cheap and independent of external services so a platform
liveness probe reflects the process, not a third party.

### 7.2 `GET /api/v1/schemes`

| Parameter | Type | Rules |
| --- | --- | --- |
| `language` | `en` \| `ml` \| `hi` | Defaults to `en` |
| `q` | string | Max 100 characters; searches names, summaries, departments, id and keywords in all three languages |
| `category` | enum | One of the nine catalogue categories |
| `government_level` | `central` \| `state` | |
| `page` | integer | ≥ 1, default 1 |
| `page_size` | integer | 1–50, default 12 |

Search normalises with NFKC and case-folding, so it works across scripts.
Filters are applied before pagination. An empty result is a normal `200` with
`items: []`, `total: 0` and an explanatory `message`; it is never an error and
never filled with fabricated records.

Response fields: `language`, `items`, `total`, `page`, `page_size`,
`total_pages`, `query`, `category`, `government_level`, `message`,
`content_note`, `disclaimer`.

### 7.3 `GET /api/v1/schemes/{id}`

Returns the full record for the requested language. An unknown id returns
`404` with `detail: "Scheme not found."`. The detail response includes
`benefits`, `documents_required`, `application_steps`, `conditions`,
`additional_sources`, `content_note` and `disclaimer`.

### 7.4 `POST /api/v1/eligibility/check`

The request accepts only the allowlisted profile fields plus `language`.
Unknown fields are rejected with `extra="forbid"`, so a client cannot smuggle
Aadhaar numbers, addresses or other identifiers into the endpoint. All profile
fields are optional; omitted fields remain unknown.

```json
{
  "language": "en",
  "age": 72,
  "state": "Kerala",
  "area": "rural",
  "annual_income": 90000,
  "bpl": true,
  "bank_account": true
}
```

Response fields: `language`, `checked_at`, `profile_fields_received`,
`results`, `disclaimer`. `profile_fields_received` lists field *names* only, so
the response cannot echo the submitted values. Each result carries the scheme
identity, outcome, outcome message, per-condition results, per-route results,
verification date, source and disclaimer.

### 7.5 Readiness semantics

Each check has one of four states:

| State | Meaning | Example |
| --- | --- | --- |
| `ok` | Verified and usable | API responding; 15 schemes loaded |
| `pending` | Planned, not built yet | ChromaDB before Day 3 |
| `not_configured` | Required credentials absent | Supabase URL/key empty |
| `error` | Expected to work but failed | Dataset file missing or invalid |

Aggregation:

```text
any check == "error"        → overall "not_ready"
all checks == "ok"          → overall "ready"
anything else               → overall "degraded"
```

On Day 2 the expected result is `degraded`:

- API is `ok`.
- `scheme_dataset` is `ok` with 15 curated schemes.
- Supabase is `not_configured`, or `pending` with a note that integration is
  deferred if credentials happen to be present.
- Gemini is `not_configured` or `pending` until Day 4.
- ChromaDB is `pending` until Day 3.

This is intentionally visible in the dashboard. A green dashboard before the
document and assistant milestones would be a lie.

### 7.6 Not implemented

| Method | Path | Milestone |
| --- | --- | --- |
| `POST` | `/api/v1/documents` | Day 3 |
| `GET` | `/api/v1/documents/{id}` | Day 3 |
| `POST` | `/api/v1/assistant/query` | Day 4 |

---

## 8. Data architecture

### 8.1 Provider

`SchemeRepository` reads `data/sample_schemes/schemes.json`, validates the whole
payload against `SchemeDataset`, then caches it. It exposes `get_dataset`,
`get_scheme`, `query` and `status`.

`query` applies category and government-level filters, then a normalized
substring search over the localised names, summaries, departments, stable id
and curated keywords, then pagination. `status` reports:

- `available: false` when the file is missing, unreadable or malformed;
- `scheme_count: 0` with `pending` when the file is valid but empty;
- `ok` with 15 records on Day 2.

The full dataset policy, record shape, condition library and verification
protocol are documented in
[`data/sample_schemes/README.md`](../data/sample_schemes/README.md).

### 8.2 Dataset summary

- 15 schemes: 10 central, 5 Kerala.
- 45 reusable conditions: 38 profile-checked, 7 manual.
- Nine categories represented: agriculture, business, education, employment,
  health, housing, insurance, pension, welfare.
- Every scheme, benefit, document, step and condition exists in English,
  Malayalam and Hindi.
- Every record was verified on 16 November 2026 against the sources below.

| Scheme | Primary source domain |
| --- | --- |
| PM-KISAN | `pmkisan.gov.in` |
| PM Vishwakarma | `pmvishwakarma.gov.in` |
| Atal Pension Yojana | `pfrda.org.in`, `jansuraksha.gov.in` |
| PMJJBY | `jansuraksha.gov.in` |
| PMSBY | `jansuraksha.gov.in` |
| PM SVANidhi | `pmsvanidhi.mohua.gov.in` |
| MGNREGS | `nrega.dord.gov.in`, `nregaplus.nic.in` |
| IGNOAPS | `nsap.dord.gov.in` |
| AB PM-JAY | `pib.gov.in`, `sha.kerala.gov.in` |
| PMAY-U | `pmaymis.gov.in` |
| KASP | `sha.kerala.gov.in` |
| Snehapoorvam | `socialsecuritymission.gov.in` |
| Samaswasam | `socialsecuritymission.gov.in` |
| Vayomithram | `socialsecuritymission.gov.in` |
| Snehasanthwanam | `socialsecuritymission.gov.in` |

### 8.3 Source policy

`app/core/source_policy.py` enforces HTTPS, no credentials, the default HTTPS
port and a reviewed domain allowlist. Each domain carries a written rationale
naming the owning department or regulator.

A blanket `.gov.in` / `.nic.in` suffix rule was rejected because:

- it accepts any host that merely ends in those strings, even when it is not
  controlled by the scheme-owning department;
- legitimate sources are not limited to those suffixes — PFRDA uses
  `pfrda.org.in` and the Kerala Social Security Mission uses
  `socialsecuritymission.gov.in`;
- an explicit allowlist records *why* each domain is trusted and is reviewed
  whenever a scheme is added.

### 8.4 Why JSON, not Supabase, on Day 2

- The API and UI can be built and tested without external credentials.
- Demos stay reproducible if the network or a database is unavailable.
- The repository interface is the seam for a future Supabase implementation, so
  the replacement does not touch routes or response models.
- Earlier planning notes promised Supabase on Day 2. That promise was
  incorrect: Day 2 prioritised verified content and a tested rules engine, and
  Supabase is now explicitly deferred.

---

## 9. Eligibility architecture

### 9.1 Data flow

```text
citizen answers (all optional)
      │
      ▼
POST /api/v1/eligibility/check
      │  Pydantic: allowlisted fields only, extra="forbid"
      ▼
eligibility_service.check_eligibility
      ├── profile_values(request)          names/values in memory only
      ├── for each of 15 schemes:
      │     └── eligibility_engine.evaluate_scheme
      │           ├── evaluate each referenced condition
      │           │     ├── pass
      │           │     ├── fail
      │           │     └── unknown
      │           │           ├── missing_profile_field
      │           │           ├── manual_verification_required
      │           │           └── unsupported_value
      │           ├── combine each DNF route (all_of)
      │           └── combine routes (any_of)
      └── sort: potentially_eligible → manual_review →
                insufficient_information → ineligible
      │
      ▼
statuses, explanations, sources, disclaimer
```

No language model is called in this flow. The evaluator is pure Python and has
no database, network or clock dependency.

### 9.2 Three-valued logic

Every condition returns `pass`, `fail` or `unknown`. Missing profile data is
always `unknown`; the engine never assumes a missing `false` or `true`. Manual
conditions are always `unknown` with `manual_verification_required`.

Within a route (`all_of`):

1. one `fail` → route `failed`;
2. otherwise one manual `unknown` → `manual_review`;
3. otherwise one profile `unknown` → `insufficient_information`;
4. otherwise → `satisfied`.

Across routes (`any_of`):

| Route status present | Scheme outcome |
| --- | --- |
| `satisfied` | `potentially_eligible` |
| `manual_review` | `manual_review` |
| `insufficient_information` | `insufficient_information` |
| only `failed` | `ineligible` |

This ordering prevents the failure mode where a subset of evaluable conditions
is reported as eligibility while a mandatory official condition remains
unchecked. A scheme such as PM-JAY can combine a fully evaluable 70+ route with
a manual SECC/state-list route: the 70+ route can return `potentially_eligible`,
while an applicant relying on the SECC route receives `manual_review`.

### 9.3 Language of the result

The API never returns the word `eligible` as an outcome. The strongest result
is `potentially_eligible`, and its message states that every *encoded*
condition passed and that this is not an official decision. Every result and
response carries the disclaimer that final eligibility is determined by the
relevant government authority.

### 9.4 Privacy guarantees

- The request body is evaluated in memory and never persisted.
- No request body or field value is logged, including on validation errors.
- The response returns condition statuses, messages and supplied field *names*,
  never supplied values.
- Unknown fields are rejected, so identifiers cannot be submitted.
- Validation errors keep the field location and message but drop the rejected
  value, so a 422 response cannot echo an accidentally submitted identifier.
- The frontend keeps answers in component state only; they are not written to
  `localStorage`, cookies or URLs, and are cleared on "Clear answers".
- The form tells citizens not to enter Aadhaar, phone numbers, addresses or
  document numbers, none of which it asks for.

### 9.5 Why not let the LLM decide

Eligibility must be reproducible, auditable and testable at boundaries. A
language model can explain a completed evaluation later, but the decision stays
in code. This is the core trust boundary of the product.

---

## 10. Security and privacy

| Concern | Day 2 control | Planned control |
| --- | --- | --- |
| API keys | Server-side `.env`, `SecretStr`, gitignored | Same; rotate keys before demo |
| Browser bundle | Only `VITE_API_BASE_URL` | Never add secrets to `VITE_*` |
| CORS | Explicit development origins | Production frontend origin only |
| Dataset sources | HTTPS + reviewed allowlist + rationale | Review on every new domain |
| Eligibility PII | Allowlisted fields, in-memory only, no body logging | Document retention policy before any persistence |
| Response leakage | Field names only, never values | Same |
| Uploads | None | Type/size limits, safe filenames, no public bucket (Day 3) |
| Errors | Generic 500 envelope, 503 for dataset errors | Add request IDs and rate limits |
| Auth | None (public demo) | Out of scope for MVP; note in demo |

The workspace remains a public demo. It does not create accounts and does not
store eligibility profiles.

---

## 11. Reliability and failure modes

| Failure | Detection | Behaviour |
| --- | --- | --- |
| Backend down | Axios network error | Error notice, retry, last catalogue page preserved |
| Slow API | 12 s timeout | Timeout message with configured base URL |
| Dataset missing | Repository status | 503 `dataset_unavailable`; readiness `error` |
| Dataset empty | Record count | Readiness `pending`, dashboard degraded |
| Invalid dataset | Pydantic validation | 503 `dataset_unavailable`; details logged |
| Invalid scheme id | Repository lookup | Clean 404 with a not-found screen |
| Empty search | Zero matches | Normal 200, empty state with reset action |
| Invalid eligibility input | Local validation | Inline error, focus on first invalid field |
| Eligibility API error | Axios error | Error notice with retry; no fabricated result |
| Missing Gemini key | Settings check | Readiness `not_configured`, AI features disabled |
| Missing Supabase key | Settings check | `not_configured`, JSON provider remains active |
| Chroma not built | Static check | `pending` until ingestion exists |
| Unhandled exception | Global handler | Logged with traceback, generic 500 to client |
| Stale poll response | Request ID | Discarded |
| Background tab | Visibility API | Polling paused, immediate refresh on return |

---

## 12. Testing strategy

Backend tests use `TestClient` with the lifespan context and run against the
real curated dataset.

| File | Coverage |
| --- | --- |
| `tests/test_api.py` | Health, readiness, system info, CORS, error envelope |
| `tests/test_scheme_dataset.py` | Dataset schema, ids, rule references, translations, dates |
| `tests/test_source_policy.py` | HTTPS, credentials, ports, allowlist and subdomains |
| `tests/test_schemes_api.py` | List/search/filter/pagination, detail, 404, localisation |
| `tests/test_eligibility.py` | Operators, boundaries, outcomes, manual review, privacy |

Also enforced:

- Ruff lint and format check for all backend code.
- Oxlint for the frontend.
- Vite production build, which catches import and bundling errors.
- Catalog key parity: EN, ML and HI contain the same 572 flattened keys.
- Manual browser verification at 1440 px and 390 px, including empty search,
  invalid id, offline API and Malayalam/Hindi switching.

---

## 13. Deployment topology (planned)

```text
GitHub
  ├── Vercel  ← frontend/  (static build, SPA routing)
  └── Render  ← backend/   (Python 3.12, uvicorn)
                     │
                     ├── Supabase PostgreSQL (deferred)
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
| JSON repository through Day 2 | No credentials, reproducible demos, faster verified-content work | Manual import until Supabase lands |
| Supabase deferred | Verified content and a tested engine matter more than the provider | Migration work remains |
| Curated 15-scheme catalogue | Depth and verified provenance beat a wide, shallow list | Narrower coverage |
| Official-source allowlist | Records *why* a domain is trusted; avoids suffix-rule false accepts | Manual review per new domain |
| Data-driven DNF rules | Reusable conditions, explicit alternatives, auditable | Some official rules are not encodable |
| Manual conditions | Honest about checks the tool cannot perform | More `manual_review` outcomes |
| Three-valued logic | Never assumes missing profile data | More `insufficient_information` outcomes |
| `potentially_eligible`, never `eligible` | Avoids overstating a preliminary result | Slightly more cautious wording |
| English verified, ML/HI editorial | No false claim of official translation | Translation quality must be reviewed separately |
| Health and readiness split | Liveness must not depend on third parties | Two endpoints to maintain |
| Evidence-first RAG (planned) | Citations are the product differentiator | More ingestion work, stricter prompts |
| Secrets only on the server | Browser bundles are public | All privileged calls go through the API |
| 30 s polling instead of websockets | Simple, adequate for an operations dashboard | Slight staleness; acceptable |
| No global state library | Keeps eligibility answers out of shared state | Revisit only if cross-page state grows |

---

## 15. Day 3 extension points

Start here when Day 2 is approved:

1. Add PDF upload with type and size limits, safe filenames and explicit
   failure states.
2. Extract text and page metadata, then chunk with overlap and character
   offsets.
3. Index chunks with `document_id`, file name and page number preserved.
4. Expose document metadata and ingestion status endpoints.
5. Add retrieval evaluation with expected pages before building generation.
6. Keep eligibility and scheme lookup out of the document pipeline.

Do not add Gemini to the eligibility path. The LLM can explain a completed
evaluation, but the decision must remain code-owned and reproducible.
