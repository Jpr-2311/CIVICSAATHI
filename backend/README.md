# CIVICSAATHI AI — Backend

FastAPI service for the CIVICSAATHI AI civic intelligence workspace.

Day 1 exposes liveness, dependency readiness and product metadata. The
service boundaries for scheme data, deterministic eligibility, document
ingestion and evidence-backed answers are scaffolded but intentionally not
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
because every integration is optional on Day 1.

## Run

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API root: <http://127.0.0.1:8000>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/api/v1/health>
- Readiness: <http://127.0.0.1:8000/api/v1/health/readiness>
- System info: <http://127.0.0.1:8000/api/v1/system/info>

Run from the `backend/` directory so the `app` package resolves.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service metadata and documentation links |
| `GET` | `/api/v1/health` | Cheap liveness probe; never calls external services |
| `GET` | `/api/v1/health/readiness` | Scheme dataset, Supabase, Gemini and ChromaDB state |
| `GET` | `/api/v1/system/info` | Languages, feature registry, disclaimer |

Readiness returns `degraded` on Day 1 by design: the dataset is empty and
the AI/database integrations are scheduled for later milestones. `pending`
means "planned and not built"; `not_configured` means "no credentials";
`error` means "expected to work but failed".

## Configuration

Settings are defined in `app/core/config.py` and loaded from `backend/.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENVIRONMENT` | `development` | `development`, `staging` or `production` |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins |
| `GEMINI_API_KEY` | empty | Server-side Gemini key (Day 4) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier |
| `SUPABASE_URL` | empty | Supabase project URL (Day 2) |
| `SUPABASE_SERVICE_ROLE_KEY` | empty | Server-only service role key |
| `CHROMA_PERSIST_DIR` | `backend/.chroma` | Local ChromaDB directory (Day 3) |

Secrets are `SecretStr` values and are never returned by any endpoint.

## Tests and lint

```powershell
python -m pytest
python -m ruff check .
```

The five tests exercise health, readiness, system info, CORS and the 404
contract. They use FastAPI's `TestClient` with the lifespan context so
application state is created exactly as it is in production.

## Structure

```text
backend/
├── app/
│   ├── main.py                    # App factory, CORS, lifespan, error handler
│   ├── core/
│   │   ├── config.py              # Typed settings from .env
│   │   └── logging.py             # Process-wide logging setup
│   ├── database/
│   │   └── scheme_repository.py   # Read-only JSON dataset adapter
│   ├── models/
│   │   └── schemas.py             # Pydantic API contract
│   ├── routes/
│   │   ├── health.py              # Liveness + readiness
│   │   └── system.py              # Product metadata
│   └── services/
│       └── system_service.py      # Feature registry and health logic
├── tests/test_api.py
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── .env.example
└── README.md
```

## Design notes

- **Thin routes, testable services.** Route handlers only assemble responses;
  business logic lives in `app/services/`.
- **Repository seam.** `SchemeRepository` is read-only today. A Supabase
  implementation can replace it on Day 2 without changing routes or schemas.
- **Liveness must stay cheap.** `/health` never depends on Supabase, Gemini or
  ChromaDB. Readiness is the place for dependency state.
- **Honest data.** An empty or malformed dataset reports `pending`/`error`; it
  is never filled with invented schemes.
- **Consistent errors.** Unhandled exceptions return
  `{ "detail": "...", "code": "internal_error" }` without leaking internals.

## Next milestone

Day 2 adds the curated scheme catalogue and deterministic eligibility engine:
`GET /api/v1/schemes`, `GET /api/v1/schemes/{id}` and
`POST /api/v1/eligibility/check`, backed by source-linked records and
rule-by-rule explanations.
