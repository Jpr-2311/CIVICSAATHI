# CIVICSAATHI AI — Backend

FastAPI service for the CIVICSAATHI AI civic intelligence workspace.

Day 2 exposes liveness, dependency readiness, product metadata, a verified
scheme catalogue and a deterministic eligibility engine. Document ingestion and
evidence-backed answers are scaffolded as future milestones and are not
implemented yet.

## Requirements

- Python 3.12 (recommended for later PyMuPDF, ChromaDB and Gemini wheel support)
- Windows PowerShell, macOS or Linux

## Setup

From the repository root:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
cp .env.example .env
```

`.env` is local-only and gitignored. The API starts with an empty `.env`
because every integration is optional today; Supabase persistence is deferred,
and Gemini/Chroma belong to later milestones.

## Run

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API root: <http://127.0.0.1:8000>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/api/v1/health>
- Readiness: <http://127.0.0.1:8000/api/v1/health/readiness>
- System info: <http://127.0.0.1:8000/api/v1/system/info>
- Schemes: <http://127.0.0.1:8000/api/v1/schemes>
- Eligibility: `POST /api/v1/eligibility/check`

Run from the `backend/` directory so the `app` package resolves.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service metadata and documentation links |
| `GET` | `/api/v1/health` | Cheap liveness probe; never calls external services |
| `GET` | `/api/v1/health/readiness` | Scheme dataset, Supabase, Gemini and ChromaDB state |
| `GET` | `/api/v1/system/info` | Languages, feature registry, disclaimer |
| `GET` | `/api/v1/schemes` | Search, filter and paginate curated schemes |
| `GET` | `/api/v1/schemes/{id}` | Full verified scheme record |
| `POST` | `/api/v1/eligibility/check` | In-memory deterministic eligibility check |

Readiness returns `degraded` on Day 2 by design: `scheme_dataset` is `ok`, while
the database, AI and vector-store dependencies are deferred or scheduled for
later milestones. `pending` means "planned and not built"; `not_configured`
means "no credentials"; `error` means "expected to work but failed".

### `GET /api/v1/schemes`

| Parameter | Type | Rules |
| --- | --- | --- |
| `language` | `en` \| `ml` \| `hi` | Defaults to `en` |
| `q` | string | Max 100 characters; searches names, summaries, departments, id and keywords |
| `category` | enum | `agriculture`, `business`, `education`, `employment`, `health`, `housing`, `insurance`, `pension`, `welfare` |
| `government_level` | `central` \| `state` | |
| `page` | integer | ≥ 1, default 1 |
| `page_size` | integer | 1–50, default 12 |

An empty result is a normal `200` with `items: []` and an explanatory message.
A missing or invalid dataset returns `503` with code `dataset_unavailable`.

### `POST /api/v1/eligibility/check`

The request accepts only allowlisted profile fields plus `language`; unknown
fields are rejected. Every profile field is optional, and an omitted field is
evaluated as `unknown`, never guessed.

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

The response returns condition statuses, route statuses, sources and a
disclaimer. It also returns the *names* of submitted profile fields so a client
can confirm what was used; it never echoes the values. Outcomes are
`potentially_eligible`, `manual_review`, `insufficient_information` or
`ineligible`.

## Configuration

Settings are defined in `app/core/config.py` and loaded from `backend/.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENVIRONMENT` | `development` | `development`, `staging` or `production` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins |
| `GEMINI_API_KEY` | empty | Server-side Gemini key (Day 4) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier |
| `SUPABASE_URL` | empty | Supabase project URL (deferred) |
| `SUPABASE_SERVICE_ROLE_KEY` | empty | Server-only service role key |
| `CHROMA_PERSIST_DIR` | `backend/.chroma` | Local ChromaDB directory (Day 3) |

Secrets are `SecretStr` values and are never returned by any endpoint.

## Tests and lint

```powershell
python -m pytest
python -m ruff check .
python -m ruff format --check .
```

The 150 tests cover:

- health, readiness, system info, CORS and the 404/error contracts;
- dataset schema, unique ids, rule references, translation keys and dates;
- the official-source allowlist, HTTPS rules and rejected hosts;
- catalogue search, category and level filters, pagination, localisation and
  unknown ids;
- every eligibility operator and boundary, all four outcomes, manual-review
  behaviour, omitted answers and response privacy.

They use FastAPI's `TestClient` with the lifespan context so application state
is created exactly as it is in production.

## Structure

```text
backend/
├── app/
│   ├── main.py                    # App factory, CORS, lifespan, 500/503 handlers
│   ├── core/
│   │   ├── config.py              # Typed settings from .env
│   │   ├── logging.py             # Process-wide logging setup
│   │   └── source_policy.py       # HTTPS official-source allowlist
│   ├── database/
│   │   └── scheme_repository.py   # Validated JSON dataset, search and paging
│   ├── models/
│   │   ├── schemes.py             # Dataset, API and eligibility contracts
│   │   └── schemas.py             # Health, readiness and system contracts
│   ├── routes/
│   │   ├── health.py              # Liveness + readiness
│   │   ├── system.py              # Product metadata
│   │   ├── schemes.py             # Catalogue list/detail
│   │   └── eligibility.py         # Deterministic eligibility check
│   └── services/
│       ├── system_service.py      # Feature registry and health logic
│       ├── scheme_service.py      # Localised list/detail responses
│       ├── eligibility_engine.py  # Pure three-valued DNF evaluator
│       └── eligibility_service.py # In-memory evaluation over all schemes
├── tests/
│   ├── test_api.py
│   ├── test_scheme_dataset.py
│   ├── test_source_policy.py
│   ├── test_schemes_api.py
│   └── test_eligibility.py
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── .env.example
└── README.md
```

## Design notes

- **Thin routes, testable services.** Route handlers assemble validated
  responses; business logic lives in `app/services/`.
- **Repository seam.** `SchemeRepository` validates and caches the JSON dataset
  on first load. A future Supabase implementation can replace it without
  changing routes or response models.
- **Rules are data, evaluation is code.** Conditions are defined once and
  referenced by schemes; the engine is pure Python with three-valued logic.
- **Manual conditions are honest.** Where an official rule depends on a
  government list, project area or inspection, the condition is `manual` and
  always yields `unknown`, forcing `manual_review`.
- **Liveness must stay cheap.** `/health` never depends on Supabase, Gemini or
  ChromaDB. Readiness is the place for dependency state.
- **No profile persistence.** Eligibility requests are evaluated in memory and
  never logged. Successful responses expose field names, not values, and
  validation errors drop the rejected value from the 422 body.
- **Honest data.** A missing or malformed dataset reports `error` and returns
  `503`; it is never filled with invented schemes.
- **Consistent errors.** Unhandled exceptions return
  `{ "detail": "...", "code": "internal_error" }` without leaking internals.

## Next milestone

Day 3 adds document intelligence: PDF upload validation, page-aware text
extraction, overlapping chunking, embeddings and ChromaDB retrieval with
document metadata. Eligibility and scheme lookup stay outside that pipeline.
