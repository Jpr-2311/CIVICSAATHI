# CIVICSAATHI AI — Backend

FastAPI service for the CIVICSAATHI AI civic intelligence workspace.

Day 3 adds **document intelligence**: secure PDF upload, page-aware text
extraction, overlapping chunks, multilingual embeddings and persistent ChromaDB
retrieval that returns real passages with page citations. The live scheme
catalogue and deterministic eligibility engine from Day 2 remain unchanged.
Gemini-generated answers, Supabase, voice and agents are **not** part of this
milestone.

## Requirements

- Python 3.12 (recommended for PyMuPDF, ChromaDB and sentence-transformers wheel support)
- Windows PowerShell, macOS or Linux
- Disk space for the embedding model (~130 MB, downloaded once on first use)

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

`.env` is local-only and gitignored. All defaults work without editing it;
Supabase and Gemini remain unconfigured by design, and document indexing uses
local files. The first document upload/search loads
`intfloat/multilingual-e5-small` and downloads it into the Hugging Face cache
unless it is already present. To pre-warm the cache, run once:

```powershell
.\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-small')"
```

To run the gated real-model integration test afterwards:

```powershell
$env:CIVICSAATHI_RUN_MODEL_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration -q
```

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
- Documents: <http://127.0.0.1:8000/api/v1/documents>

Run from the `backend/` directory so the `app` package resolves. Uploads are
read into memory with a hard byte cap; PDF parsing, embedding and vector I/O run
in a threadpool so the event loop stays responsive.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service metadata and documentation links |
| `GET` | `/api/v1/health` | Cheap liveness probe; never calls external services |
| `GET` | `/api/v1/health/readiness` | Dataset, Supabase, Gemini and ChromaDB state |
| `GET` | `/api/v1/system/info` | Languages, feature registry, disclaimer |
| `GET` | `/api/v1/schemes` | Search, filter and paginate curated schemes |
| `GET` | `/api/v1/schemes/{id}` | Full verified scheme record |
| `POST` | `/api/v1/eligibility/check` | In-memory deterministic eligibility check |
| `POST` | `/api/v1/documents/upload` | Validate, store and index a PDF (201; 200 on duplicate) |
| `GET` | `/api/v1/documents` | List documents with status and passage counts |
| `GET` | `/api/v1/documents/{document_id}` | Full document metadata (no server paths) |
| `POST` | `/api/v1/documents/search` | Retrieve page-cited passages |
| `DELETE` | `/api/v1/documents/{document_id}` | Delete one document, its file and its vectors |

Readiness now reports `vector_store: ok` with the indexed passage count. The
overall status is still `degraded` because Supabase and Gemini are unconfigured
or pending; that is an honest signal, not a failure. `pending` means "planned and
not built", `not_configured` means "no credentials", `error` means "expected to
work but failed".

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

### `POST /api/v1/documents/upload`

Send `multipart/form-data` with a single `file` field. Validation is by content,
not by extension or MIME type:

- real `%PDF-` header and a PDF PyMuPDF can open; corrupt files are rejected;
- non-empty, at most `DOCUMENT_MAX_UPLOAD_BYTES` (default 10 MB) and
  `DOCUMENT_MAX_PAGES` (default 100);
- encrypted/password-protected PDFs are rejected;
- the client filename is reduced to a safe *display-only* name — the actual
  storage name is a server-generated UUID, so no path traversal is possible;
- embedded scripts, external resources and annotations are never executed or
  fetched; text is read in memory and no user-supplied path is opened.

The response contains `document` (id, safe filename, status, page/chunk counts,
size, upload time, checksum, text character count, OCR flag, PDF metadata) and
`duplicate`. Identical content (SHA-256) returns HTTP `200` with
`duplicate: true` and the existing record; no duplicate vectors are created. A
new document returns `201`. Statuses are `indexed` (searchable passages exist),
`needs_ocr` (little extractable text) or `empty`. No response exposes a local
filesystem path or storage filename.

### `GET /api/v1/documents/search`

```json
{
  "query": "കർഷകർക്ക് കൃഷി സഹായം",
  "top_k": 5,
  "document_id": null
}
```

- `query`: 1–1000 non-blank characters.
- `top_k`: optional, clamped to `1..DOCUMENT_SEARCH_MAX_TOP_K` (default 5, max 20).
- `document_id`: optional filter; an unknown id returns `404 document_not_found`.

Each result is a real indexed passage with `document_id`,
`original_filename`, `page_number`, `chunk_index`, `text`, `distance` and
`similarity`. When nothing relevant is found the response is still `200` with
`count: 0`, `has_evidence: false`, an empty `results` list and an explicit
"No relevant evidence was found in the uploaded documents." message. Every
response includes `similarity_notice`: similarity is not proof that a passage is
factually correct.

Documents are stored in `backend/data/documents/` and vectors in the
`civicsaathi_government_documents` Chroma collection. Both are gitignored and
survive restarts; the JSON registry and collection are reopened on startup.

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
| `CHROMA_PERSIST_DIR` | `backend/.chroma` | Persistent ChromaDB directory |
| `DOCUMENT_COLLECTION_NAME` | `civicsaathi_government_documents` | Chroma collection |
| `DOCUMENT_STORAGE_DIR` | `backend/data/documents` | Server-only PDF and registry directory |
| `DOCUMENT_MAX_UPLOAD_BYTES` | `10485760` | Upload size cap in bytes |
| `DOCUMENT_MAX_PAGES` | `100` | Page cap per PDF |
| `DOCUMENT_CHUNK_CHARS` | `1200` | Target passage length |
| `DOCUMENT_CHUNK_OVERLAP_CHARS` | `200` | Overlap between consecutive passages |
| `DOCUMENT_MIN_CHUNK_CHARS` | `40` | Shorter trailing fragments are merged/dropped |
| `DOCUMENT_OCR_MIN_PAGE_CHARS` | `80` | Below this average, a PDF is flagged `needs_ocr` |
| `DOCUMENT_SEARCH_TOP_K` | `5` | Default result count |
| `DOCUMENT_SEARCH_MAX_TOP_K` | `20` | Upper bound for `top_k` |
| `DOCUMENT_SEARCH_MAX_DISTANCE` | `1.0` | Cosine distance above this is treated as no evidence |
| `EMBEDDING_MODEL_NAME` | `intfloat/multilingual-e5-small` | Multilingual EN/ML/HI embedding model |

Secrets are `SecretStr` values and are never returned by any endpoint. Storage
paths are server-side only. `passage: ` and `query: ` prefixes and normalized
vectors follow the multilingual-e5 contract.

## Tests and lint

```powershell
python -m pytest
python -m ruff check app tests
```

**190 unit/API tests pass and 1 real-model integration test is skipped by
default.** The gated test is opt-in so no routine test depends on a model
download:

```powershell
$env:CIVICSAATHI_RUN_MODEL_TESTS = '1'
python -m pytest tests/integration -q
```

The suite covers:

- health, readiness, system info, CORS and the 404/error contracts;
- dataset schema, unique ids, rule references, translation keys and dates;
- the official-source allowlist, HTTPS rules and rejected hosts;
- catalogue search, filters, pagination, localisation and unknown ids;
- every eligibility operator, outcomes, manual review and response privacy;
- PDF validation (fake header, empty, oversized, encrypted, corrupt, too many
  pages) and safe display filenames;
- page-aware chunking (provenance, overlap, paragraph boundaries, empty and
  tiny pages, exact Malayalam/Hindi Unicode);
- embedding prefixes and normalization with a recording fake model;
- ChromaDB insert/search/filter/delete, reopen persistence, deduplication and
  rejected document ids;
- service ingestion, duplicate handling, three-language retrieval, bounded
  `top_k`, no-evidence results and scoped deletion;
- all six document HTTP endpoints and their error envelopes.

Unit tests use a deterministic injectable `FakeEmbedder` and tiny in-memory
PDFs, so they need neither the neural model nor a network. The gated integration
test uses the real `intfloat/multilingual-e5-small` model to confirm that English,
Malayalam and Hindi queries retrieve the correct English page passage.

## Structure

```text
backend/
├── app/
│   ├── main.py                    # App entrypoint, CORS, lifespan, error handlers
│   ├── core/
│   │   ├── config.py              # Typed settings from .env
│   │   ├── logging.py             # Process-wide logging setup
│   │   └── source_policy.py       # HTTPS official-source allowlist
│   ├── database/
│   │   ├── scheme_repository.py   # Validated JSON dataset, search and paging
│   │   └── document_store.py      # JSON registry + persistent ChromaDB store
│   ├── models/
│   │   ├── schemes.py             # Dataset, API and eligibility contracts
│   │   ├── schemas.py             # Health, readiness and system contracts
│   │   └── documents.py           # Document upload/list/search/delete contracts
│   ├── routes/
│   │   ├── health.py              # Liveness + readiness
│   │   ├── system.py              # Product metadata
│   │   ├── schemes.py             # Catalogue list/detail
│   │   ├── eligibility.py         # Deterministic eligibility check
│   │   └── documents.py           # Upload, list, detail, search, delete
│   └── services/
│       ├── system_service.py      # Feature registry and health logic
│       ├── scheme_service.py      # Localised list/detail responses
│       ├── eligibility_engine.py  # Pure three-valued DNF evaluator
│       ├── eligibility_service.py # In-memory evaluation over all schemes
│       ├── pdf_extractor.py       # Secure validation + PyMuPDF text extraction
│       ├── chunker.py             # Page-aware overlapping chunker
│       ├── embeddings.py          # Lazy multilingual-e5 embedder
│       └── document_service.py    # Ingestion, retrieval and deletion orchestration
├── tests/
│   ├── document_helpers.py        # Tiny PDFs and deterministic FakeEmbedder
│   ├── test_api.py
│   ├── test_scheme_dataset.py
│   ├── test_source_policy.py
│   ├── test_schemes_api.py
│   ├── test_eligibility.py
│   ├── test_pdf_extractor.py
│   ├── test_chunker.py
│   ├── test_embeddings.py
│   ├── test_document_store.py
│   ├── test_document_service.py
│   ├── test_documents_api.py
│   └── integration/
│       └── test_documents_integration.py  # Gated real-model test
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── .env.example
└── README.md
```

## Design notes

- **Thin routes, testable services.** Route handlers assemble validated
  responses; business logic lives in `app/services/`. Blocking document work is
  offloaded with `run_in_threadpool`.
- **Repository seam.** `SchemeRepository` validates and caches the JSON dataset
  on first load. A future Supabase implementation can replace it without
  changing routes or response models.
- **Rules are data, evaluation is code.** Conditions are defined once and
  referenced by schemes; the engine is pure Python with three-valued logic.
- **Uploads are content-validated.** A `.pdf` suffix is never trusted. Files are
  opened from bytes, encrypted and corrupt PDFs are rejected, and a generated
  UUID is the only storage filename.
- **Provenance is never lost.** Each chunk belongs to exactly one page; overlap
  is applied within a page only, so a passage always cites the right page.
- **Unicode is preserved.** Malayalam and Hindi text is neither transliterated
  nor normalized away before embedding.
- **Lazy heavy models.** Importing the API and running unit tests never loads
  sentence-transformers; the first real embedding loads the model once and
  reuses it.
- **Deduplication by checksum.** Re-uploading identical bytes returns the
  existing record and creates no new vectors; deletion is scoped to one
  `document_id` so unrelated documents are untouched.
- **Honest retrieval.** Results are actual passages, never generated text. No
  match yields an explicit no-evidence response, and every response notes that
  similarity is not proof of correctness.
- **Liveness must stay cheap.** `/health` never depends on ChromaDB, Supabase or
  Gemini. Readiness is the place for dependency state.
- **No profile persistence.** Eligibility requests are evaluated in memory and
  never logged. Successful responses expose field names, not values, and
  validation errors drop the rejected value from the 422 body.
- **Consistent errors.** Unhandled exceptions return
  `{ "detail": "...", "code": "internal_error" }` without leaking internals.

## Limitations

- **No OCR.** Image-only/scanned PDFs are flagged `needs_ocr` and are not
  searchable until OCR is added in a later milestone.
- **No generated answers.** This release returns source passages only; the
  Gemini RAG assistant is Day 4.
- **Text-layer quality varies.** Extraction quality follows the PDF's embedded
  text layer; badly encoded official PDFs may yield poor passages.
- **Cosine distance, not factuality.** Retrieval ranks by embedding similarity;
  citizens must verify the passage against the official source.
- **Single-node persistence.** ChromaDB uses a local disk directory; deployment
  needs a mounted volume or a managed replacement.

## Next milestone

Day 4 adds the evidence-backed assistant: Gemini answers grounded only in
retrieved passages, with file and page citations in all three languages.
Eligibility and scheme lookup stay outside that pipeline, and the document
retrieval contract above remains the grounding source.
