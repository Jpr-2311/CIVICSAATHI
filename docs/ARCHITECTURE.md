# Architecture — CIVICSAATHI AI

**Status:** Day 3 complete · **Version:** 0.2.0
**Last updated:** 18 November 2026

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

### Built by Day 3

- Secure PDF upload: real-content validation, 10 MB / 100 page caps, rejection
  of encrypted, corrupt and empty files, safe display names and generated
  server-side storage names.
- PyMuPDF text extraction that keeps one passage tied to exactly one page.
- Page-aware chunking with paragraph boundaries, 1200-character targets,
  200-character overlap and exact Unicode preservation for Malayalam and Hindi.
- Lazy `intfloat/multilingual-e5-small` embeddings with `passage: ` / `query: `
  prefixes, normalized vectors and an injectable fake embedder for tests.
- Persistent ChromaDB storage with SHA-256 deduplication, reopen safety and
  deletion scoped to one document.
- Five document endpoints (upload, list, detail, search, delete) and a live
  trilingual document library with upload progress, status, details and search
  results carrying filename and page citations.
- Explicit no-evidence results and a standing notice that similarity is not
  proof of factual correctness.

### Deliberately not built yet

- Supabase persistence. Deferred beyond Day 2; the JSON repository is the
  active provider and the seam for a future database implementation.
- Gemini answers and citation rendering (Day 4).
- OCR for image-only PDFs; such files are flagged `needs_ocr` and are not
  searchable in this release.
- Voice input and agent workflows.
- Authentication and user accounts (not required for the hackathon MVP).

The UI labels every unbuilt module with its milestone. Scheme discovery,
eligibility and document intelligence are live; the assistant remains an honest
preview.

---

## 2. Design principles

1. **Trust before fluency.** A boring correct answer beats a confident wrong
   one. Eligibility is computed by code. The LLM may explain, never decide.
2. **Deterministic core, probabilistic periphery.** Rules, retrieval and
   citation assembly are deterministic. Embedding similarity is a ranking
   signal, not a decision; no language generation happens on Day 3.
3. **Evidence before answers.** A document result is a real passage with a
   filename and page number, or an explicit no-evidence result. Nothing is
   paraphrased into a confident answer.
4. **Honest states.** Empty data is `pending`. Missing credentials are
   `not_configured`. A failed check is `error`. A missing answer is `unknown`.
   Nothing is silently green and no field is guessed.
5. **Server-owned secrets.** API keys live only in backend environment
   variables. `VITE_*` values are public by definition, and storage paths never
   leave the server.
6. **Seam-first data access.** Routes never read JSON or ChromaDB directly. A
   repository/store boundary keeps the API contract stable if storage changes.
7. **Progressive disclosure.** The workspace shows what is live, what is a
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
                                            │  eligibility · documents│
                                            └───────┬─────────┬───────┘
                                                    │         │
                         ┌──────────────────────────┘         └──────────────────┐
                         ▼                                                       ▼
            ┌────────────────────────┐                              ┌────────────────────────┐
            │ Day 2: JSON repository │                              │ Day 3: document store  │
            │ Supabase (deferred)    │                              │ PDFs · JSON registry   │
            │                        │                              │ ChromaDB + e5 vectors  │
            └────────────────────────┘                              └────────────────────────┘
```

The browser never talks to a database, Gemini or ChromaDB directly. Every
privileged operation goes through the API, which keeps credentials, storage
paths and policy enforcement on the server. Day 4 will add Gemini above the
same retrieval layer; it is not wired in this release.

---

## 4. Runtime topology (development)

| Component | Location | Port | Command |
| --- | --- | --- | --- |
| FastAPI | `backend/` | 8000 | `python -m uvicorn app.main:app --reload` |
| Vite dev server | `frontend/` | 5173 | `npm run dev` |
| Curated dataset | `data/sample_schemes/schemes.json` | — | Read once and cached per process |
| Document files + registry | `backend/data/documents/` | — | Created on first startup; gitignored |
| Local vector store | `backend/.chroma` | — | ChromaDB collection; created on first startup |

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
| `/app/documents` | `DocumentsPage` | Live PDF library, upload and page-cited search |
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
local to `EligibilityPage`; document library, upload, detail and search state is
local to `DocumentsPage`. This keeps sensitive eligibility answers out of shared
application state.

### 5.3 API boundary

`services/api.js` wraps Axios and exposes `getHealth`, `getReadiness`,
`getSystemInfo`, `getSchemes`, `getScheme`, `checkEligibility`, `listDocuments`,
`getDocument`, `uploadDocument`, `deleteDocument` and `searchDocuments`.

- Every scheme list/detail request carries the current interface language.
- Empty and undefined query parameters are dropped before the request.
- Scheme search requests are debounced by 350 ms and aborted when replaced;
  document search is an explicit submit action.
- Upload requests use `FormData` and report axios upload progress.
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

**Eligibility.** A 34-field optional form grouped into five sections. Numeric
fields are validated locally (whole numbers, age 0–120, non-negative money,
years since transplant 0–100) and invalid values block submission. Blank answers are omitted from the payload so
the engine records `unknown` rather than guessing. Boolean questions use a
tri-state yes / no / not sure control. Results show outcome counts and filters,
per-condition pass/fail/unknown explanations, per-route combination status,
sources, verification dates and the preliminary-result disclaimer. The page
re-runs the check when the interface language changes.

**Documents.** Live library with upload (drag-and-drop or picker, progress bar,
multi-file support), per-document status and passage counts, detail view
(checksum and PDF metadata), deletion with confirmation, and multilingual
search with an optional document filter. Results show the real passage,
filename, page number and similarity, plus a verification notice. Empty,
loading, upload-error and no-evidence states are explicit. No fake documents or
answers are seeded.

The assistant is still a preview and is labelled as such in the sidebar,
dashboard and landing page. Document intelligence is marked live.

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
| Document library load failure | Error notice with retry; no fake documents shown |
| Invalid or oversized PDF | Clear upload error with the server's reason; no document created |
| Duplicate PDF | Existing record returned with a duplicate notice; no extra vectors |
| Scanned/low-text PDF | Stored as `needs_ocr` and excluded from search with an honest message |
| Document search with no match | Empty state with `no relevant evidence` message |
| Document deletion | Confirmation step, then scoped delete and refreshed library |
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
app/routes/documents.py     Upload, list, detail, search, delete PDF endpoints
app/services/system_service.py
                            Health, readiness, feature registry, disclaimer
app/services/scheme_service.py
                            Localised list/detail responses and notices
app/services/eligibility_engine.py
                            Three-valued DNF evaluator, pure functions
app/services/eligibility_service.py
                            In-memory evaluation over all schemes
app/services/pdf_extractor.py
                            Secure PDF validation, PyMuPDF text per page
app/services/chunker.py     Page-aware overlapping chunker, Unicode-safe
app/services/embeddings.py  Lazy multilingual-e5 provider, e5 prefixes
app/services/document_service.py
                            Ingestion, retrieval, dedup and deletion orchestration
app/database/scheme_repository.py
                            Validated read-only dataset adapter, search
app/database/document_store.py
                            JSON registry + persistent ChromaDB collection
app/models/schemes.py       Dataset, API and eligibility contracts
app/models/schemas.py       Health, readiness and system contracts
app/models/documents.py     Document upload/list/search/delete contracts
```

### 6.2 Request lifecycle

1. Uvicorn starts the app and runs the lifespan hook.
2. The hook stores `started_at`, a `SchemeRepository`, a `DocumentStore` and a
   `DocumentService` on `app.state`.
3. A request enters a thin route handler.
4. The handler calls a service function with repository/store state and validated
   query/request parameters. Document work (parsing, embedding, vector I/O) is
   offloaded with `run_in_threadpool` so the event loop stays responsive.
5. Pydantic validates and serializes the response model.
6. Dataset failures return a 503 `dataset_unavailable` envelope; invalid uploads
   return a safe 400/413 envelope; document operation failures return 404 or
   500 with a `code`. Unexpected exceptions are logged by the global handler and
   returned as a generic 500 envelope without internal details.

The repository validates the whole dataset with Pydantic on first load and
caches it. A malformed record is a deployment error, not something the API
patches at request time. The document store reopens the JSON registry and the
Chroma collection on startup; both survive restarts.

### 6.3 Why lifespan state

The repository, document store/service and start time are process-scoped, not
request-scoped. Creating them once in the lifespan hook avoids repeated file I/O
and ChromaDB client creation, makes health uptime accurate, and gives tests a
controlled startup/shutdown boundary through `TestClient` as a context manager.
Document API tests replace `app.state.document_service` with a store backed by a
temporary directory and a fake embedder, then restore the original state.

### 6.4 Configuration

`Settings` is a `pydantic-settings` model loaded from `backend/.env` and cached
with `lru_cache`. It exposes normalized CORS origins, the dataset path and
boolean helpers (`gemini_configured`, `supabase_configured`). Secrets use
`SecretStr` and are never included in responses or logs.

Day 3 settings are server-side only: `document_storage_dir`,
`chroma_persist_dir`, `document_collection_name`, upload/size/page limits,
chunk size/overlap/minimum, the OCR text-density hint, search defaults and
bounds, and `embedding_model_name` (default
`intfloat/multilingual-e5-small`). Storage paths are never returned by an API.
The full list with defaults is in [`backend/README.md`](../backend/README.md).

### 6.5 Error contract

Dataset unavailable:

```json
{ "detail": "Curated dataset file is missing.", "code": "dataset_unavailable" }
```

Rejected uploads and document operations use the same `{ detail, code }`
envelope with a safe, human-readable detail:

```json
{ "detail": "Encrypted PDFs are not supported. Remove the password and retry.", "code": "encrypted_pdf" }
```

```json
{ "detail": "The requested document was not found.", "code": "document_not_found" }
```

Validation failures return `422 validation_error`; oversized uploads return
`413 file_too_large`. Unhandled exceptions return HTTP 500:

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
| `POST` | `/api/v1/documents/upload` | Validate, store and index a PDF |
| `GET` | `/api/v1/documents` | List documents with status and passage counts |
| `POST` | `/api/v1/documents/search` | Retrieve page-cited passages |
| `GET` | `/api/v1/documents/{document_id}` | Read document metadata |
| `DELETE` | `/api/v1/documents/{document_id}` | Delete one document and its vectors |

`/health` remains cheap and independent of external services so a platform
liveness probe reflects the process, not a third party. Document routes accept
only server-generated ids matching `[A-Za-z0-9_-]+`, so traversal attempts are
rejected at validation before any path is built.

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
| `ok` | Verified and usable | API responding; 15 schemes loaded; ChromaDB collection open |
| `pending` | Planned, not built yet | Assistant (Day 4) |
| `not_configured` | Required credentials absent | Supabase URL/key or Gemini key empty |
| `error` | Expected to work but failed | Dataset file missing or invalid; ChromaDB unopenable |

Aggregation:

```text
any check == "error"        → overall "not_ready"
all checks == "ok"          → overall "ready"
anything else               → overall "degraded"
```

On Day 3 the expected result is still `degraded`:

- API is `ok`.
- `scheme_dataset` is `ok` with 15 curated schemes.
- `vector_store` is `ok` with the live passage count from the Chroma collection.
- Supabase is `not_configured`, or `pending` with a note that integration is
  deferred if credentials happen to be present.
- Gemini is `not_configured` or `pending` until Day 4.
- The assistant feature is `pending` until Day 4.

This is intentionally visible in the dashboard. A green dashboard before the
assistant milestone would be a lie.

### 7.6 Document endpoints in detail

**Upload.** `POST /api/v1/documents/upload` takes `multipart/form-data` with one
`file`. The body is capped at `DOCUMENT_MAX_UPLOAD_BYTES + 1` bytes before
extraction. A real PDF header and a successful PyMuPDF open are required; empty,
encrypted, corrupt and over-page files are rejected with a safe `code`. A new
document returns `201`; identical content (SHA-256 checksum) returns `200` with
`duplicate: true` and the existing record, creating no new vectors. The response
never includes a storage path.

**List / detail.** `GET /api/v1/documents` returns summaries (id, safe filename,
status, page/chunk counts, size, upload time). `GET /api/v1/documents/{id}`
adds checksum, text-character count, OCR flag and sanitized PDF metadata. The
id is validated against `[A-Za-z0-9_-]+`.

**Search.** `POST /api/v1/documents/search` accepts `query` (1–1000 non-blank
characters), optional `top_k` (clamped to `1..DOCUMENT_SEARCH_MAX_TOP_K`) and an
optional `document_id` filter. Results are real passages with `page_number`,
`chunk_index`, `original_filename`, `text`, `distance` and `similarity`. No
match returns `200` with `has_evidence: false`, an empty `results` list and an
explicit no-evidence message. Every response carries `similarity_notice`.

**Delete.** `DELETE /api/v1/documents/{id}` deletes only that document's
vectors (Chroma `where` filter), its registry record and its stored PDF;
unrelated documents are untouched.

### 7.7 Not implemented

| Method | Path | Milestone |
| --- | --- | --- |
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
- 53 reusable conditions: 44 profile-checked, 9 manual (dataset version 3).
- Nine categories represented: agriculture, business, education, employment,
  health, housing, insurance, pension, welfare.
- Every scheme, benefit, document, step and condition exists in English,
  Malayalam and Hindi.
- Twelve records were corrected and re-verified on 18 November 2026; the three
  unchanged records (PM Vishwakarma, MGNREGS, Vayomithram) retain their original
  16 November 2026 verification date. See
  [`DAY_2_1_DATASET_AUDIT.md`](DAY_2_1_DATASET_AUDIT.md).

| Scheme | Primary source domain |
| --- | --- |
| PM-KISAN | `pmkisan.gov.in` |
| PM Vishwakarma | `pmvishwakarma.gov.in` |
| Atal Pension Yojana | `pfrda.org.in`, `jansuraksha.gov.in` |
| PMJJBY | `jansuraksha.gov.in` |
| PMSBY | `jansuraksha.gov.in` |
| PM SVANidhi | `pib.gov.in` |
| MGNREGS | `nrega.dord.gov.in`, `nregaplus.nic.in` |
| IGNOAPS | `nsap.dord.gov.in` |
| AB PM-JAY | `pib.gov.in` |
| PMAY-U 2.0 | `pmay-urban.gov.in`, `pmaymis.gov.in` |
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

### 8.5 Document storage

Two stores back the Day 3 pipeline, both under server-controlled directories:

- `backend/data/documents/` holds each uploaded PDF under a generated
  `uuid4().hex` filename plus an atomically written `index.json` registry of
  `DocumentDetail` records. The registry is validated by Pydantic on read and
  reloaded on every operation, so a restart never trusts an unchecked file.
- `backend/.chroma/` holds the persistent `civicsaathi_government_documents`
  collection with cosine distance. Vectors are upserted by
  `{document_id}:{chunk_index}` ids, so re-indexing a document is idempotent.
  Each vector carries `document_id`, `original_filename`, `page_number` and
  `chunk_index` in its metadata.

The registry owns document-level facts (status, checksum, counts); Chroma owns
passage-level similarity. Deletion is scoped by `document_id` in both stores.
Storage directories are gitignored, and no API response exposes them.

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

## 10. Document intelligence

### 10.1 Ingestion pipeline

```text
UploadFile (capped read)
   │
   ▼
extract_document()          bytes only; no user path; %PDF- header + PyMuPDF open
   │  rejects empty / oversized / encrypted / corrupt / >100 pages
   ▼
ExtractedDocument           one ExtractedPage per PDF page + SHA-256 checksum
   │
   ▼
chunk_pages()               paragraphs/sentences → ≤1200 chars, 200 overlap,
   │                        tiny fragments merged, page number attached
   ▼
EmbeddingService            "passage: " + text → normalized multilingual-e5 vector
   │
   ▼
VectorStore.add_document_chunks()
   │                        ChromaDB upsert by {document_id}:{chunk_index}
   ▼
DocumentRegistry.add()      atomic JSON write, status indexed / needs_ocr / empty
```

If any step after the PDF is written fails, vectors and the file are rolled back
so no orphaned record is left. A duplicate checksum short-circuits before any
work and returns the existing record.

### 10.2 Chunking rules

- A chunk never spans two pages; its `page_number` is therefore unambiguous.
- Boundaries prefer blank lines, then sentences (including `।` and `॥`), then
  words; only a single overlong token is hard-split into overlapping windows.
- Overlap is the tail of the previous chunk on the *same* page, so a passage
  always cites the page its text came from.
- Empty and whitespace pages produce no chunks; a tiny trailing fragment is
  merged into its predecessor instead of becoming a near-empty vector.
- Malayalam and Hindi code points pass through unchanged — no transliteration,
  NFKC folding or ASCII encoding.

### 10.3 Embeddings

`intfloat/multilingual-e5-small` is loaded lazily on first use, once per process.
Passages are prefixed `passage: `, queries `query: `, and vectors are L2
normalized, following the model's published contract. An `EmbeddingProvider`
protocol makes the store agnostic to the model: unit tests inject a
deterministic `FakeEmbedder` that maps English/Malayalam/Hindi concepts to the
same vector and unrelated words to an opposing vector, while a gated integration
test uses the real model to prove cross-language retrieval.

### 10.4 Retrieval semantics

A query embedding is compared with cosine distance. Results above
`DOCUMENT_SEARCH_MAX_DISTANCE` (default 1.0) are dropped. What remains is
returned as real passages, never generated text; each carries the filename and
page. If nothing survives, `has_evidence` is `false` and the message says so
explicitly. The standing `similarity_notice` states that similarity is not proof
of factual correctness.

### 10.5 Security controls

| Concern | Control |
| --- | --- |
| Fake PDFs | `%PDF-` header check plus a real PyMuPDF open; corrupt files rejected |
| Oversized files | Byte cap applied while reading, before extraction |
| Encrypted PDFs | Rejected unless the password is removed by the uploader |
| Path traversal | Client filename is display-only; storage name is a generated UUID; ids validated |
| PDF scripts / external resources | Never executed, downloaded or followed; text-only extraction |
| Unrelated deletion | Chroma delete and registry delete are both scoped to one id |
| Path leakage | API models contain no storage fields; responses are derived from contracts |

### 10.6 Limitations

Image-only PDFs are flagged `needs_ocr` and produce no passages. Extraction
quality depends on the PDF's embedded text layer. Embedding similarity ranks by
topic, not truth. ChromaDB is a single-node local store and needs a persistent
volume or a managed replacement when deployed. No generated answers, OCR,
Gemini, voice or agents exist in this milestone.

---

## 11. Security and privacy

| Concern | Control through Day 3 | Planned control |
| --- | --- | --- |
| API keys | Server-side `.env`, `SecretStr`, gitignored | Rotate keys before demo |
| Browser bundle | Only `VITE_API_BASE_URL` | Never add secrets to `VITE_*` |
| CORS | Explicit development origins | Production frontend origin only |
| Dataset sources | HTTPS + reviewed allowlist + rationale | Review on every new domain |
| Eligibility PII | Allowlisted fields, in-memory only, no body logging | Document retention policy before any persistence |
| Response leakage | Field names only, never values; no storage paths | Same |
| Uploads | Content validation, 10 MB / 100 page caps, encrypted/corrupt rejected, generated storage names, no script execution | Retention policy and virus scanning for production |
| Vector isolation | Chroma deletes scoped by `document_id` | Same |
| Errors | Generic 500 envelope, 503 for dataset errors, safe codes for uploads | Add request IDs and rate limits |
| Auth | None (public demo) | Out of scope for MVP; note in demo |

The workspace remains a public demo. It does not create accounts and does not
store eligibility profiles. Uploaded PDFs are stored on the server, not in a
public bucket, and are never used to train a model.

---

## 12. Reliability and failure modes

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
| Invalid or oversized PDF | Extractor validation | 400/413 with safe `code`; no record or file created |
| Encrypted / corrupt PDF | PyMuPDF open check | 400 with a clear reason; no partial index |
| Duplicate PDF | SHA-256 lookup | 200 `duplicate: true`, existing record, no new vectors |
| Scanned / low-text PDF | Text-density check | Stored `needs_ocr`, not searchable, honest status |
| Ingestion failure mid-write | Exception in service | Vectors and file rolled back; no orphaned record |
| Document search with no match | Distance filter | Explicit no-evidence response, empty result list |
| Chroma unavailable | Store status | Readiness `error`; document operations return a safe 500 |
| Missing Gemini key | Settings check | Readiness `not_configured`, AI features disabled |
| Missing Supabase key | Settings check | `not_configured`, JSON provider remains active |
| Unhandled exception | Global handler | Logged with traceback, generic 500 to client |
| Stale poll response | Request ID | Discarded |
| Background tab | Visibility API | Polling paused, immediate refresh on return |

---

## 13. Testing strategy

Backend tests use `TestClient` with the lifespan context and run against the
real curated dataset. Document unit tests use an injectable `FakeEmbedder` and
tiny in-memory PDFs, so they need no model download or network.

| File | Coverage |
| --- | --- |
| `tests/test_api.py` | Health, readiness, system info, CORS, error envelope |
| `tests/test_scheme_dataset.py` | Dataset schema, ids, rule references, translations, dates |
| `tests/test_source_policy.py` | HTTPS, credentials, ports, allowlist and subdomains |
| `tests/test_schemes_api.py` | List/search/filter/pagination, detail, 404, localisation |
| `tests/test_eligibility.py` | Operators, boundaries, outcomes, manual review, privacy |
| `tests/test_pdf_extractor.py` | Fake/empty/oversized/encrypted/corrupt PDFs, safe filenames, OCR flag |
| `tests/test_chunker.py` | Page provenance, overlap, paragraph boundaries, tiny/empty pages, Unicode |
| `tests/test_embeddings.py` | `passage:`/`query:` prefixes and normalization with a recording model |
| `tests/test_document_store.py` | Insert, search, filter, delete, reopen persistence, dedup, unsafe ids |
| `tests/test_document_service.py` | Ingestion, duplicate handling, EN/ML/HI retrieval, no-evidence, scoped delete |
| `tests/test_documents_api.py` | All six document endpoints, validation errors and response contracts |
| `tests/integration/test_documents_integration.py` | Gated real-model cross-language retrieval |

Result: **190 passed, 1 skipped** in the default run (the gated real-model test).
With `CIVICSAATHI_RUN_MODEL_TESTS=1`, the integration test also passes using
`intfloat/multilingual-e5-small` from the local Hugging Face cache.

Also enforced:

- Ruff lint and format check for all backend code.
- Oxlint for the frontend.
- Vite production build, which catches import and bundling errors.
- Catalog key parity: EN, ML and HI contain identical flattened key sets
  (verified by a script; the count changes as copy is added).
- Manual browser verification at 1440 px and 390 px for the Day 2 shell,
  including empty search, invalid id, offline API and language switching. The
  Day 3 document UI is covered by API tests and a production build but has not
  yet been manually exercised in a browser.

---

## 14. Deployment topology (planned)

```text
GitHub
  ├── Vercel  ← frontend/  (static build, SPA routing)
  └── Render  ← backend/   (Python 3.12, uvicorn)
                     │
                     ├── schemes.json (validated repository)
                     ├── documents/ + .chroma (mounted persistent disk)
                     ├── Supabase PostgreSQL (deferred)
                     └── Google Gemini API (Day 4)
```

Configuration requirements:

- `VITE_API_BASE_URL` points at the Render service.
- `CORS_ORIGINS` contains only the deployed frontend origin.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are Render environment
  secrets, never repository variables.
- `CHROMA_PERSIST_DIR` and `DOCUMENT_STORAGE_DIR` must use a mounted disk on
  Render, or be replaced with a managed vector/object store if the instance is
  ephemeral.
- The embedding model is downloaded on first use; allow network access and disk
  at build/first-boot time, or pre-warm the Hugging Face cache.
- Health checks should target `/api/v1/health`; readiness is for dashboards and
  operators, not platform restarts.

---

## 15. Decision log

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
| Evidence-first RAG (planned for Day 4) | Citations are the product differentiator | No generated answers in Day 3 |
| Multilingual-e5-small | EN/ML/HI retrieval without an LLM call; runs locally after download | Model download and CPU time on first use |
| `passage:` / `query:` prefixes + normalization | Follows the model's published contract | Text must be prefixed consistently |
| Page-scoped chunks | A citation must never point at the wrong page | No cross-page context in a single passage |
| JSON registry + Chroma, not Supabase | Reproducible local persistence without credentials | Manual migration if a database lands later |
| Checksum dedup + scoped delete | No duplicate vectors; deleting one PDF leaves others intact | Identical bytes cannot be indexed twice |
| Secrets and paths only on the server | Browser bundles are public | All privileged calls go through the API |
| 30 s polling instead of websockets | Simple, adequate for an operations dashboard | Slight staleness; acceptable |
| No global state library | Keeps eligibility answers out of shared state | Revisit only if cross-page state grows |

---

## 16. Day 4 extension points

Start here when Day 3 is approved:

1. Inject the existing retrieval results into a Gemini prompt; do not let the
   model invent facts outside the retrieved passages.
2. Render file and page citations beside every generated sentence, and keep the
   explicit no-evidence response when retrieval returns nothing.
3. Localize the assistant flow in English, Malayalam and Hindi using the same
   key-parity discipline as the rest of the UI.
4. Add retrieval/generation evaluation sets with expected pages before changing
   chunking or model settings.
5. Keep eligibility and scheme lookup out of the document pipeline.

Do not add Gemini to the eligibility path. The LLM can explain a completed
evaluation, but the decision must remain code-owned and reproducible.
