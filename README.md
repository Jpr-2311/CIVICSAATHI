# CIVICSAATHI AI

**Government information, without the maze.**

A multilingual civic intelligence assistant for Kerala. CIVICSAATHI AI turns
scattered government schemes, eligibility rules and official notification PDFs
into clear, verifiable guidance in English, Malayalam or Hindi.

> **Build status: Day 2.1 of 7 complete.** The foundation, live telemetry, a
> corrected and re-verified 15-scheme catalogue and a deterministic eligibility
> engine are working. Document intelligence and the RAG assistant are clearly
> marked as previews rather than shipped as mocks.

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
- **Missing evidence is stated**, never filled in with a plausible guess.
- **English, Malayalam and Hindi** are treated as first-class languages.

## What works today

| Area | Day 2 state |
| --- | --- |
| Marketing site | Responsive landing page with trilingual answer preview, problem framing, workflow and trust sections |
| Workspace | Dashboard shell, sidebar, mobile drawer, live/preview labels, 404 page |
| Scheme catalogue | Search, nine category filters, central/state filters, pagination, loading/empty/error states |
| Scheme detail | Full verified record with benefits, documents, steps, conditions and official sources |
| Eligibility | Optional 34-field form, tri-state answers, deterministic results and per-condition explanations |
| Data layer | 15 curated schemes, 53 reusable conditions (44 profile, 9 manual), all source-linked and validated by Pydantic |
| Backend | FastAPI app with typed settings, CORS, logging, lifespan state and consistent error envelopes |
| Failure states | Skeletons, offline banner, retry actions, 404 handling and stale-data protection |
| Quality | 150 backend tests passing; Ruff clean; Oxlint clean; production frontend build succeeds |

Document intelligence and the assistant remain clearly labelled previews. They
do not pretend to be functional yet.

## Screenshots

| Landing page | Workspace dashboard |
| :---: | :---: |
| [![Landing page](docs/screenshots/landing-desktop.png)](docs/screenshots/landing-desktop.png) | [![Workspace dashboard](docs/screenshots/dashboard-desktop.png)](docs/screenshots/dashboard-desktop.png) |

These screenshots show the foundation shell. The live Day 2 catalogue and
eligibility pages are available at `/app/schemes` and `/app/eligibility`.

<details>
<summary>Mobile views (390 px)</summary>

| Landing page | Workspace dashboard |
| :---: | :---: |
| ![Landing page on mobile](docs/screenshots/landing-mobile.png) | ![Workspace dashboard on mobile](docs/screenshots/dashboard-mobile.png) |

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
│                        ├── /app/documents        (preview)      │
│                        └── /app/assistant        (preview)      │
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
│                                                                 │
│  routes → services → repository                                 │
│  core/source_policy.py       HTTPS official-source allowlist    │
│  core/config.py              server-side secrets only           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────────────────────┐
              │ data/sample_schemes/schemes.json           │
              │ 15 schemes · 53 conditions · verified      │
              └────────────────────────────────────────────┘
```

Remaining milestones: PyMuPDF + ChromaDB ingestion (Day 3), Gemini RAG with page
citations (Day 4), trilingual polish and evaluation (Day 5–6), deployment
(Day 7). Supabase persistence is deferred beyond Day 2; the validated JSON
repository is the active provider and the seam for a future database.

Read the full design in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and the
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
| AI (planned) | Google Gemini, evidence-first RAG |
| Documents (planned) | PyMuPDF, semantic chunking, embeddings, ChromaDB |
| Deployment (planned) | Vercel (frontend), Render (backend) |

## Repository layout

```text
CIVICSAATHI-AI/
├── backend/
│   ├── app/
│   │   ├── core/                  # settings, logging, source allowlist
│   │   ├── database/              # scheme repository and search
│   │   ├── models/                # Pydantic API and dataset contracts
│   │   ├── routes/                # health, system, schemes, eligibility
│   │   ├── services/              # responses, rules engine, readiness
│   │   └── main.py                # FastAPI entrypoint
│   ├── tests/                     # 150 API, dataset and engine tests
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
│   │   ├── pages/                 # landing, dashboard, schemes, eligibility
│   │   ├── services/api.js        # Axios client and error normalization
│   │   └── index.css              # design tokens and motion rules
│   ├── public/
│   └── README.md
├── data/sample_schemes/
│   ├── schemes.json               # 15 verified schemes and 53 conditions
│   └── README.md                  # dataset, rule and source policy
├── docs/
│   ├── ARCHITECTURE.md
│   └── screenshots/
└── README.md
```

## Quick start

### Prerequisites

- Node.js 20+ and npm
- Python 3.12
- Two terminals (API + web app)

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
directly from `backend/`.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # optional; defaults to port 8000
npm run dev
```

Open <http://localhost:5173>. The dashboard polls the API and shows an honest
offline state if the backend is not running.

### 3. Verify

| URL | Expected |
| --- | --- |
| <http://localhost:5173/app/schemes> | Verified catalogue with search and filters |
| <http://localhost:5173/app/eligibility> | Optional form and preliminary results |
| <http://localhost:5173/app> | Workspace dashboard with live API telemetry |
| <http://127.0.0.1:8000/docs> | Swagger UI |
| <http://127.0.0.1:8000/api/v1/schemes> | 15 curated schemes, paginated |
| <http://127.0.0.1:8000/api/v1/health/readiness> | `degraded`, with `scheme_dataset: ok` |

Readiness is expected to be `degraded` right now: the curated dataset is `ok`,
while the database, AI and vector-store dependencies are scheduled for later
days or deferred. That is a truthful signal, not a failure.

## Configuration

Backend variables live in `backend/.env` (copied from `.env.example`).
Frontend variables live in `frontend/.env.local` (copied from `.env.example`).

| Variable | Scope | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | Backend | `development`, `staging`, `production` |
| `LOG_LEVEL` | Backend | Defaults to `INFO` |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins |
| `GEMINI_API_KEY` | Backend | Server-side only; Day 4 |
| `GEMINI_MODEL` | Backend | Defaults to `gemini-2.5-flash` |
| `SUPABASE_URL` | Backend | Deferred; JSON repository is active |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Server-only; never ship to the client |
| `CHROMA_PERSIST_DIR` | Backend | Defaults to `backend/.chroma`; Day 3 |
| `VITE_API_BASE_URL` | Frontend | Public API origin; defaults to `http://127.0.0.1:8000` |

`VITE_*` values are embedded in the browser bundle. Only public configuration
belongs there. All secrets stay in the backend environment.

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
Every answer is optional; omitted answers remain `unknown`. Responses return
condition statuses and supplied field *names*, never the values. Outcomes are
`potentially_eligible`, `ineligible`, `insufficient_information` or
`manual_review` — never a bare `eligible`.

Not implemented yet:

- `POST /api/v1/documents` and `GET /api/v1/documents/{id}` (Day 3)
- `POST /api/v1/assistant/query` (Day 4)

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
7. **Evidence or nothing (planned).** Document answers must cite a file and
   page, or say the evidence was not found.
8. **Secrets stay server-side.** No API key is bundled, logged or committed.

## Quality checks

```powershell
# Backend
cd backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .

# Frontend
cd frontend
npm run lint
npm run build
```

Current Day 2.1 result: **150/150 backend tests pass**, Ruff lint and format are
clean, Oxlint is clean and the Vite production build completes. Screenshots
were verified at 1440 px and 390 px in all three languages with zero horizontal
overflow.

## Roadmap

| Day | Milestone | Outcome |
| --- | --- | --- |
| 1 | Foundation | Design system, routes, live API contract, health telemetry |
| 2 | Schemes & eligibility | 15-scheme verified catalogue, search and deterministic rules engine |
| 3 | Document intelligence | PDF upload, extraction, chunking, embeddings, ChromaDB retrieval |
| 4 | Evidence-backed assistant | Gemini RAG in English, Malayalam and Hindi with page citations |
| 5 | Trilingual journey | Full English, Malayalam and Hindi experience and end-to-end UX polish |
| 6 | Hardening | Evaluation set, failure-mode tests, accessibility and performance |
| 7 | Deploy & demo | Vercel + Render deployment, demo script, submission assets |

## Deployment notes

The project is not deployed yet. When it is:

- **Frontend (Vercel):** root `frontend`, build `npm run build`, output `dist`,
  environment `VITE_API_BASE_URL=https://<backend-host>`. Configure an SPA
  rewrite to `index.html` if the host does not handle client-side routes.
- **Backend (Render):** root `backend`, Python 3.12, build
  `pip install -r requirements.txt`, start
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, environment
  `ENVIRONMENT=production` and the relevant secrets.
- Update `CORS_ORIGINS` on the backend to the deployed frontend origin.

## Disclaimer

CIVICSAATHI AI is a hackathon prototype and is not an official Government of
Kerala service. Always verify scheme details on the official portal linked in
each record. Eligibility results are preliminary and rule-based; final
eligibility is determined by the relevant government authority. The
illustrative answer card on the landing page is demo content, not an official
answer.
