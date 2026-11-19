# CIVICSAATHI AI

**Government information, without the maze.**

A multilingual civic intelligence assistant for Kerala. CIVICSAATHI AI turns
scattered government schemes, eligibility rules and official notification PDFs
into clear, verifiable guidance in English, Malayalam or Hindi.

> **Build status: Day 7 final verification complete; not deployed.** The local
> foundation, live telemetry, a corrected and re-verified 15-scheme catalogue, a
> deterministic eligibility engine, a live document-intelligence pipeline and an
> evidence-gated multilingual assistant are connected into one trilingual
> journey. Final verification exercised a real PM-KISAN government PDF end to
> end in English, Malayalam and Hindi, plus restart persistence, deletion and
> operation without Gemini. **Live Gemini generation is not verified:** all four
> final attempts returned `504 gemini_timeout`, so no live answer is claimed. No
> Render or Vercel deployment exists. See
> [`docs/FINAL_VERIFICATION.md`](docs/FINAL_VERIFICATION.md).

Built for **NxtWave IDEA//FORGE — Civic Pulse track**.

![CIVICSAATHI AI landing page](docs/screenshots/landing-desktop.png)

## The problem

A scheme can exist, a citizen can qualify, and the information can still be
unreachable. Notifications are long, portals are fragmented, and eligibility
language is hard to translate into a decision. Most AI demos make this worse by
guessing.

CIVICSAATHI AI takes the opposite approach:

- **Rules decide eligibility**, not a language model.
- **Official sources only** — no invented schemes, benefits or links.
- **Every scheme carries provenance** — a source URL and a verification date.
- **Every document passage carries its page number** — no answer without a source.
- **Missing evidence is stated**, never filled in with a plausible guess.
- **English, Malayalam and Hindi** are treated as first-class languages.

## What works today

| Area | Verified state (Day 7) |
| --- | --- |
| Marketing site | Responsive landing page with trilingual answer preview, problem framing, workflow and trust sections |
| Workspace | Dashboard shell, sidebar, mobile drawer, live module labels, 404 page |
| Scheme catalogue | Search, nine category filters, central/state filters, pagination, loading/empty/error states |
| Scheme detail | Full verified record with benefits, documents, steps, conditions and official sources |
| Eligibility | Optional 34-field form, tri-state answers, deterministic results and per-condition explanations |
| Data layer | 15 curated schemes, 53 reusable conditions (44 profile, 9 manual), all source-linked and validated by Pydantic |
| Document intelligence | Secure PDF upload, PyMuPDF extraction, page-aware overlapping chunks, multilingual embeddings, persistent ChromaDB search with page citations |
| Backend | FastAPI app with typed settings, CORS, logging, lifespan state, threadpool document work and consistent error envelopes |
| Assistant | Gemini-backed answers grounded in retrieved passages, EN/ML/HI output, backend-built citations and honest insufficient-evidence states. Live provider generation was not verified on Day 7 (four `504 gemini_timeout` responses); safe failure states were verified. |
| No-Gemini mode | Separate backend process reported `gemini=not_configured`; schemes and document listing stayed available and assistant requests returned safe `503 assistant_not_configured` |
| Manual end-to-end | Real 12-page PM-KISAN PDF produced 33 chunks; EN/ML/HI search each returned 5 page-9 passages; restart persistence, deletion and deletion persistence verified |
| Connected journey | Real dashboard counts, scheme→eligibility context, indexed document→assistant handoff, source inspection and language-preserving navigation |
| Failure states | Skeletons, honest unavailable totals, stale-context recovery, offline banner, retry actions, 404 handling, upload progress and assistant timeout/error states |
| Quality | 247 backend tests passing (3 gated skipped), 23 frontend tests, Ruff/Oxlint clean, 640-key EN/ML/HI parity, production frontend build succeeds |

Document intelligence is verified in English, Malayalam and Hindi against a
genuine PM-KISAN guidelines PDF: upload, page-aware indexing, retrieval and page
metadata all worked, and survived a backend restart. The assistant is
evidence-gated: retrieval happens first, citations are built by the backend, and
the system returns an explicit insufficient-evidence response when the documents
do not support an answer. On Day 7, four live generation attempts timed out
(`504 gemini_timeout`); live answer quality therefore remains unverified, while
the safe failure path and the no-evidence path were verified. Without a key,
`/api/v1/assistant/ask` returns a safe `503` while scheme and document features
keep working.

Read the final evidence record in
[`docs/FINAL_VERIFICATION.md`](docs/FINAL_VERIFICATION.md), the presentation
narrative in
[`docs/HACKATHON_PRESENTATION.md`](docs/HACKATHON_PRESENTATION.md), the timed demo
in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md), the assistant design in
[`docs/DAY_4_GEMINI.md`](docs/DAY_4_GEMINI.md) and the deployment runbook in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Screenshots

These captures are from the **local Day 7 production build** with the real API and
a genuine PM-KISAN PDF indexed. They are not production screenshots. The desktop
viewport is 1440 × 1000; mobile is 390 × 844.

| Landing page | Workspace dashboard |
| :---: | :---: |
| [![Landing page](docs/screenshots/landing-desktop.png)](docs/screenshots/landing-desktop.png) | [![Workspace dashboard](docs/screenshots/dashboard-desktop.png)](docs/screenshots/dashboard-desktop.png) |

| Scheme discovery | Eligibility results |
| :---: | :---: |
| [![Scheme discovery](docs/screenshots/schemes-desktop.png)](docs/screenshots/schemes-desktop.png) | [![Eligibility results](docs/screenshots/eligibility-results-desktop.png)](docs/screenshots/eligibility-results-desktop.png) |

| Official document library | Grounded assistant (empty state) |
| :---: | :---: |
| [![Document library with indexed PM-KISAN PDF](docs/screenshots/documents-library-desktop.png)](docs/screenshots/documents-library-desktop.png) | [![Assistant workspace](docs/screenshots/assistant-desktop.png)](docs/screenshots/assistant-desktop.png) |

| Malayalam workspace |
| :---: |
| [![Malayalam dashboard](docs/screenshots/dashboard-ml-desktop.png)](docs/screenshots/dashboard-ml-desktop.png) |

<details>
<summary>Mobile views (390 px)</summary>

| Landing page | Workspace dashboard | Scheme discovery |
| :---: | :---: | :---: |
| ![Landing page on mobile](docs/screenshots/landing-mobile.png) | ![Workspace dashboard on mobile](docs/screenshots/dashboard-mobile.png) | ![Scheme discovery on mobile](docs/screenshots/schemes-mobile.png) |

</details>

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ Browser                                                         │
│ React 19 · Vite 8 · Tailwind CSS 4 · React Router 7             │
│                                                                 │
│  Landing page          Workspace shell                          │
│  /                     /app                                     │
│                        ├── /app/schemes          (live)         │
│                        ├── /app/schemes/:id      (live)         │
│                        ├── /app/eligibility      (live)         │
│                        ├── /app/documents        (live)         │
│                        └── /app/assistant        (live)         │
│                                                                 │
│  Axios client · cancellation · error normalization              │
│  30 s polling · loading / empty / offline / stale states        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ JSON over HTTP
┌───────────────────────────▼─────────────────────────────────────┐
│ FastAPI  ·  /api/v1                                             │
│                                                                 │
│  GET  /health                liveness, no dependencies          │
│  GET  /health/readiness      dataset, DB, AI, vector store      │
│  GET  /system/info           languages, features, disclaimer    │
│  GET  /schemes               search · filter · pagination       │
│  GET  /schemes/{id}          verified detail record             │
│  POST /eligibility/check     in-memory deterministic rules      │
│  POST /documents/upload      validate + index a PDF             │
│  GET  /documents             library with status                │
│  GET  /documents/{id}        document metadata                  │
│  POST /documents/search      page-cited passages                │
│  DELETE /documents/{id}      scoped document deletion           │
│  POST /assistant/ask          grounded answer + citations        │
│                                                                 │
│  routes → services → repository / store                         │
│  assistant_service.py        retrieval → evidence → validation  │
│  core/source_policy.py       HTTPS official-source allowlist    │
│  core/config.py              server-side secrets only           │
└──────────────┬─────────────────────────────┬─────────────────────┘
               │                             │
 ┌─────────────▼──────────────┐  ┌───────────▼────────────────────────┐
 │ data/sample_schemes/       │  │ backend/data/documents/ + .chroma  │
 │ schemes.json               │  │ PDFs, JSON registry, ChromaDB      │
 │ 15 schemes · 53 conditions │  │ multilingual-e5-small embeddings   │
 └────────────────────────────┘  └───────────────┬────────────────────┘
                                                 │ bounded passages
                                 ┌───────────────▼────────────────────┐
                                 │ Google Gemini (server-side key)    │
                                 │ structured JSON · evidence ids only│
                                 └────────────────────────────────────┘
```

### Document pipeline (Day 3)

```text
PDF bytes → content validation → PyMuPDF text per page → page-aware chunks
          → "passage: " multilingual-e5-small embeddings → ChromaDB (cosine)
query     → "query: " embedding → nearest passages → page + filename citations
```

- **Secure upload:** real PDF header and parse check, 10 MB / 100 page caps,
  encrypted/corrupt/empty PDFs rejected, safe display names, generated UUID
  storage names, no path traversal, no PDF script execution.
- **Page-aware chunks:** ~1200 characters with 200-character overlap, paragraph
  and sentence boundaries respected, tiny fragments merged, empty pages skipped,
  Unicode (Malayalam/Hindi) preserved exactly. Every chunk records its page.
- **Persistent store:** JSON registry plus ChromaDB collection
  `civicsaathi_government_documents`; SHA-256 deduplication; reopen-safe;
  deletion scoped to one `document_id`.
- **Honest retrieval:** `top_k` bounded (1–20), optional document filter,
  explicit no-relevant-evidence response, and a notice that similarity is not
  proof of correctness. Document search itself never generates an answer.

### Assistant pipeline (Day 4)

```text
question → validation → language + optional document filter
         → multilingual retrieval → evidence quality gate
         → bounded Gemini prompt → strict JSON parsing
         → evidence-id validation → backend-built citations → response
```

- **No evidence, no model call.** Insufficient retrieval returns a localized
  no-answer response immediately.
- **Untrusted passages.** Embedded instructions in PDF text never change the
  assistant's rules; the system instruction forbids secret disclosure, invented
  facts and eligibility decisions.
- **Backend-owned citations.** Gemini returns only `evidence_id` values. Titles,
  ids, pages and excerpts come from the retrieved passage; fabricated ids are
  discarded and a single corrective retry is allowed.
- **Bounded by design.** Retrieval, context characters and output tokens are
  capped; the request has a timeout and errors map to safe `detail`/`code`
  envelopes. Nothing is persisted.

Day 7 completed final verification and product polish without changing the
architecture. A real official PDF was exercised end to end, EN/ML/HI retrieval
was confirmed, restart persistence and deletion passed, and a separate backend
without a Gemini key remained usable. Live generation was attempted four times
and returned `504 gemini_timeout`; it is therefore not claimed as verified. Day 6
prepared the app for production but no Render/Vercel deployment was performed,
because deployment credentials and account access were unavailable. Supabase
persistence remains deferred; the validated JSON repository and ChromaDB store
are the active providers and the seams for a future database. The full evidence
record is in [`docs/FINAL_VERIFICATION.md`](docs/FINAL_VERIFICATION.md).

Read the grounded-generation design in
[`docs/DAY_4_GEMINI.md`](docs/DAY_4_GEMINI.md), the full design in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the
dataset policy in
[`data/sample_schemes/README.md`](data/sample_schemes/README.md).

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, Vite 8, JavaScript, Tailwind CSS 4, React Router 7, Axios, Lucide |
| Backend | Python 3.12, FastAPI, Pydantic 2, pydantic-settings, Uvicorn |
| Data (Day 2) | Validated JSON repository with 15 curated schemes |
| Data (deferred) | Supabase PostgreSQL |
| Eligibility | Pure-Python three-valued rule evaluator, data-driven DNF rules |
| Documents (Day 3) | PyMuPDF, sentence-transformers `intfloat/multilingual-e5-small`, ChromaDB, python-multipart |
| AI (Day 4) | Official `google-genai` SDK, evidence-first RAG, structured JSON output |
| Deployment (prepared) | Vercel (frontend), Render (backend) |

## Repository layout

```text
CIVICSAATHI-AI/
├── backend/
│   ├── app/
│   │   ├── core/                  # settings, logging, source allowlist
│   │   ├── database/              # scheme repository, document store + ChromaDB
│   │   ├── models/                # Pydantic API, dataset and document contracts
│   │   ├── routes/                # health, system, schemes, eligibility, documents, assistant
│   │   ├── services/              # rules, readiness, document pipeline, Gemini, assistant RAG
│   │   └── main.py                # FastAPI entrypoint
│   ├── tests/                     # 247 unit/API tests + gated integration tests
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/            # layout, marketing, UI, brand
│   │   ├── data/modules.js        # module status and feature copy
│   │   ├── hooks/                 # snapshot polling
│   │   ├── i18n/                  # EN/ML/HI catalogs
│   │   ├── lib/                   # class and formatting helpers
│   │   ├── pages/                 # landing, dashboard, schemes, eligibility, documents, assistant
│   │   ├── services/api.js        # Axios client and error normalization
│   │   └── index.css              # design tokens and motion rules
│   ├── public/
│   └── README.md
├── data/sample_schemes/
│   ├── schemes.json               # 15 verified schemes and 53 conditions
│   └── README.md                  # dataset, rule and source policy
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DAY_4_GEMINI.md
│   ├── DAY_5_INTEGRATION.md
│   ├── DEMO_READINESS.md
│   ├── DEMO_SCRIPT.md
│   ├── DEPLOYMENT.md
│   ├── FINAL_VERIFICATION.md
│   ├── HACKATHON_PRESENTATION.md
│   └── screenshots/
└── README.md
```

## Quick start

### Prerequisites

- Node.js 20+ and npm
- Python 3.12
- Two terminals (API + web app)
- ~130 MB disk for the multilingual embedding model (downloaded on first use)

### 1. Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

macOS/Linux:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation, run
`.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`
directly from `backend/`. The first document request downloads
`intfloat/multilingual-e5-small` into the Hugging Face cache; pre-warm it with
`python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-small')"` if you want the delay to happen at setup time.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # sets VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

Copying the example file is required for local development: the browser bundle
has **no localhost fallback**, so without `VITE_API_BASE_URL` the app reports
`api_base_url_missing`. Open <http://localhost:5173>. The dashboard polls the API
and shows an honest offline state if the backend is not running.

### 3. Verify

| URL | Expected |
| --- | --- |
| <http://localhost:5173/app/schemes> | Verified catalogue with search and filters |
| <http://localhost:5173/app/eligibility> | Optional form and preliminary results |
| <http://localhost:5173/app/documents> | Upload a text-based PDF and search its pages |
| <http://localhost:5173/app/assistant> | Ask a grounded question (requires a configured Gemini key) |
| <http://localhost:5173/app> | Workspace dashboard with live API telemetry |
| <http://127.0.0.1:8000/docs> | Swagger UI |
| <http://127.0.0.1:8000/api/v1/schemes> | 15 curated schemes, paginated |
| <http://127.0.0.1:8000/api/v1/documents> | Empty list before the first upload |
| <http://127.0.0.1:8000/api/v1/health/readiness> | `degraded` while Supabase is unconfigured; dataset, vector store and assistant features are `ok`/`live` |

The connected shortcuts are
`/app/schemes/<id> → /app/eligibility?scheme_id=<id>` and an indexed PDF on
`/app/documents → /app/assistant?document=<id>`. Expanding an assistant citation
returns to `/app/documents?document=<id>&page=<n>` with the cited excerpt. These
are UI state handoffs only; no profile value is placed in a URL.

Readiness remains expectedly `degraded` while Supabase is intentionally
unconfigured. Gemini is reported `ok` only when a key is present; this checks
credential presence, not a live provider response. The assistant feature itself
is registered as `live`. That is a truthful signal, not a failure.

## Configuration

Backend variables live in `backend/.env` (copied from `.env.example`).
Frontend variables live in `frontend/.env.local` (copied from `.env.example`).

| Variable | Scope | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | Backend | `development`, `staging`, `production` |
| `LOG_LEVEL` | Backend | Defaults to `INFO` |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins |
| `GEMINI_API_KEY` | Backend | Server-side only; empty disables assistant answers |
| `GEMINI_MODEL` | Backend | Defaults to `gemini-2.5-flash` |
| `ASSISTANT_TOP_K` | Backend | Retrieved passages before the quality gate; default `5` |
| `ASSISTANT_MIN_SIMILARITY` | Backend | Heuristic evidence threshold on top of the Day 3 distance gate; default `0.30` |
| `ASSISTANT_MAX_EVIDENCE_CHUNKS` | Backend | Maximum passages sent to Gemini; default `5` |
| `ASSISTANT_MAX_CONTEXT_CHARS` | Backend | Total excerpt budget; default `12000` |
| `ASSISTANT_REQUEST_TIMEOUT_SECONDS` | Backend | Gemini request timeout; default `30` |
| `ASSISTANT_MAX_OUTPUT_TOKENS` | Backend | Generation cap; default `900` |
| `SUPABASE_URL` | Backend | Deferred; JSON repository is active |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Server-only; never ship to the client |
| `CHROMA_PERSIST_DIR` | Backend | Defaults to `backend/.chroma` |
| `DOCUMENT_COLLECTION_NAME` | Backend | Defaults to `civicsaathi_government_documents` |
| `DOCUMENT_STORAGE_DIR` | Backend | Server-only PDF storage, defaults to `backend/data/documents` |
| `DOCUMENT_MAX_UPLOAD_BYTES` | Backend | Default 10 MB |
| `DOCUMENT_MAX_PAGES` | Backend | Default 100 |
| `DOCUMENT_CHUNK_CHARS` | Backend | Default 1200 |
| `DOCUMENT_CHUNK_OVERLAP_CHARS` | Backend | Default 200 |
| `DOCUMENT_MIN_CHUNK_CHARS` | Backend | Default 40 |
| `DOCUMENT_OCR_MIN_PAGE_CHARS` | Backend | Default 80; lower text density flags `needs_ocr` |
| `DOCUMENT_SEARCH_TOP_K` | Backend | Default 5 |
| `DOCUMENT_SEARCH_MAX_TOP_K` | Backend | Default 20 |
| `DOCUMENT_SEARCH_MAX_DISTANCE` | Backend | Default 1.0 cosine distance |
| `EMBEDDING_MODEL_NAME` | Backend | Defaults to `intfloat/multilingual-e5-small` |
| `VITE_API_BASE_URL` | Frontend | Public API origin, e.g. `http://127.0.0.1:8000`; no built-in fallback — copy `.env.example` to `.env.local` |

`VITE_API_BASE_URL` must be an **origin only** (`scheme://host[:port]`). Do not
append `/api/v1`: the client adds that prefix itself, and including it produces a
doubled `/api/v1/api/v1` path and a `404`. A trailing slash is harmless. `VITE_*`
values are embedded in the browser bundle, so only public configuration belongs
there. All secrets and storage paths stay in the backend environment.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Service name, version and docs link |
| `GET` | `/api/v1/health` | Liveness and uptime |
| `GET` | `/api/v1/health/readiness` | Dependency state with human-readable details |
| `GET` | `/api/v1/system/info` | Product metadata, languages and feature registry |
| `GET` | `/api/v1/schemes` | Search, filter and paginate the curated catalogue |
| `GET` | `/api/v1/schemes/{id}` | Full verified scheme record |
| `POST` | `/api/v1/eligibility/check` | Deterministic in-memory eligibility check |
| `POST` | `/api/v1/documents/upload` | Validate, store and index a PDF (201; 200 on duplicate) |
| `GET` | `/api/v1/documents` | List documents with status and passage counts |
| `GET` | `/api/v1/documents/{document_id}` | Full document metadata |
| `POST` | `/api/v1/documents/search` | Retrieve real passages with page citations |
| `DELETE` | `/api/v1/documents/{document_id}` | Delete one document, its file and its vectors |
| `POST` | `/api/v1/assistant/ask` | Grounded answer with validated citations (no history) |

List query parameters: `language`, `q` (max 100 characters), `category`,
`government_level`, `page` and `page_size` (1–50, default 12). An empty result
is a normal `200` with a message, never fabricated data.

```json
{
  "status": "ok",
  "service": "civicsaathi-api",
  "version": "0.2.0",
  "environment": "development",
  "timestamp": "2026-11-17T09:15:28Z",
  "uptime_seconds": 6.07
}
```

Eligibility accepts only allowlisted profile fields and rejects unknown fields.
The Day 5 `?scheme_id=<id>` browser handoff is not an API field: adding
`scheme_id` to the JSON body still returns `422 validation_error`. Every answer
is optional; omitted answers remain `unknown`. Responses return
condition statuses and supplied field *names*, never the values. Outcomes are
`potentially_eligible`, `ineligible`, `insufficient_information` or
`manual_review` — never a bare `eligible`.

Document search accepts `query` (1–1000 characters), optional `top_k`
(1–20, default 5) and optional `document_id`. Results are actual indexed
passages with filename and page number; no match returns
`has_evidence: false` with an explicit no-evidence message. Every response notes
that similarity is not proof of factual correctness. Assistant requests accept
`question`, optional `language` (`en`, `ml`, `hi`) and optional `document_id`, and
reject unknown fields such as `system_prompt`. Responses include the answer,
backend-built citations and a localized insufficient-evidence state. There is no
`/assistant/query` endpoint and no history endpoint. See
[`backend/README.md`](backend/README.md) and
[`docs/DAY_4_GEMINI.md`](docs/DAY_4_GEMINI.md) for the full contracts.

## Trust and safety rules

1. **Deterministic eligibility.** The language model never produces the result.
   Rule evaluation is pure Python and lives in the backend.
2. **Official sources only.** Every scheme URL passes an HTTPS allowlist with a
   recorded verification rationale, and every record carries a verification
   date.
3. **No fabricated data.** A missing or invalid dataset returns `503`; an empty
   search returns an honest empty state.
4. **No guessing from silence.** A missing profile answer is `unknown`, not
   `false`. Manual official checks force `manual_review`.
5. **Preliminary language only.** The strongest outcome is
   `potentially_eligible`; final eligibility belongs to the relevant government
   authority.
6. **No profile persistence.** Eligibility answers are evaluated in memory,
   never stored and never written to browser storage.
7. **Evidence or nothing.** Document results are real passages with a file and
   page citation, or say the evidence was not found. Assistant answers are
   generated only from those passages and carry server-built citations.
8. **Secure document handling.** PDFs are validated by content, capped by size
   and pages, never executed, and stored under generated names; no API response
   exposes a server path.
9. **Secrets stay server-side.** No API key is bundled, logged or committed.
10. **Prompt injection is contained.** Retrieved passages are untrusted data;
    embedded instructions cannot change rules or reveal secrets.
11. **No eligibility decisions from the model.** The assistant states document
    conditions; only the deterministic Day 2 engine produces a preliminary
    outcome.

## Quality checks

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check app tests
.\.venv\Scripts\python.exe -m ruff format --check .

# Gated real-model integration test (after the model is cached)
$env:CIVICSAATHI_RUN_MODEL_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration -q

# Opt-in LIVE Gemini test (spends a real API call; never needed by default)
$env:CIVICSAATHI_RUN_GEMINI_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration/test_gemini_integration.py -q

# Frontend
cd frontend
npm run lint
npm test
npm run build
```

Current Day 7 result: **247 backend tests pass** with 3 gated integration tests
skipped, **23 frontend tests pass**, Ruff and Oxlint are clean, EN/ML/HI catalogs
have identical 640-key sets and the Vite production build completes (with a
628 kB chunk-size warning). Backend startup without Gemini, production CORS
guards, persistent path resolution and deployment configuration are covered by
tests. A production build configured with
`VITE_API_BASE_URL=https://api.example.com` contained no localhost reference.
Gemini is mocked in the default suite; four live checks timed out with
`504 gemini_timeout`, so live generation is **not** claimed as passing. No
prompt, answer or key is logged. Day 7 also performed manual browser and API
checks on a real PM-KISAN PDF — upload, EN/ML/HI retrieval, restart persistence,
deletion and no-Gemini operation — recorded in
[`docs/FINAL_VERIFICATION.md`](docs/FINAL_VERIFICATION.md). No deployment was
performed.

## Roadmap

| Day | Milestone | Outcome |
| --- | --- | --- |
| 1 | Foundation | Design system, routes, live API contract, health telemetry |
| 2 | Schemes & eligibility | 15-scheme verified catalogue, search and deterministic rules engine |
| 3 | Document intelligence | PDF upload/extraction, page-aware chunking, multilingual embeddings, ChromaDB retrieval with page citations |
| 4 | Evidence-backed assistant | Complete: Gemini RAG in EN/ML/HI with validated page citations |
| 5 | Trilingual journey | Complete: connected EN/ML/HI journey with honest states and source inspection |
| 6 | Production readiness | Prepared: env/CORS/storage guards, Vercel SPA config and deployment runbook |
| 7 | Final verification & demo | Complete locally: real PDF EN/ML/HI journey, UI polish, presentation and demo assets. Deployment and live Gemini remain unverified |

## Deployment notes

The project is **not deployed yet**. Deployment is prepared but requires
Render/Vercel credentials and account access. On Day 7, `vercel whoami` failed
with "The specified token is not valid", the Render CLI was unavailable, and
neither `VERCEL_TOKEN` nor `RENDER_API_KEY` was present in the environment; no
production URL exists. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the
complete runbook and the Day 7 status notes.

- **Frontend (Vercel):** root `frontend`, build `npm run build`, output `dist`,
  environment `VITE_API_BASE_URL=https://<backend-host>`. `frontend/vercel.json`
  supplies the SPA deep-link rewrite.
- **Backend (Render):** root `backend`, build
  `pip install -r requirements.txt`, start
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`, environment
  `ENVIRONMENT=production` and the relevant backend-only secrets.
- Set exact HTTPS `CORS_ORIGINS`; wildcards are rejected, and production requires
  HTTPS origins.
- Mount a persistent disk and set `PERSISTENT_DATA_DIR` to an absolute path such
  as `/data/civicsaathi`. Existing local ChromaDB/registry data is not
  automatically migrated; allow time and disk for the embedding model on first
  boot.
- Set `GEMINI_API_KEY` and, if needed, `GEMINI_MODEL` as backend environment
  secrets. Never add them to `VITE_*` variables or the browser bundle.

## Disclaimer

CIVICSAATHI AI is a hackathon prototype and is not an official Government of
Kerala service. Always verify scheme details on the official portal linked in
each record. Eligibility results are preliminary and rule-based; final
eligibility is determined by the relevant government authority. Document search
returns source passages, not verified advice — check the official notice.
Generated assistant answers are grounded in uploaded documents but may be
incomplete; verify every detail on the cited page and the official source. The
illustrative answer card on the landing page is demo content, not an official
answer.
