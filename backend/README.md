# CIVICSAATHI AI — Backend

FastAPI service for the CIVICSAATHI AI civic intelligence workspace.

Day 4 adds the **evidence-grounded assistant**: official `google-genai` SDK
integration, bounded retrieval from the Day 3 document pipeline, strict JSON
validation and backend-populated page citations. The live scheme catalogue,
deterministic eligibility engine and document APIs remain unchanged. Supabase,
voice, agents and persistent chat history are still out of scope.

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

`.env` is local-only and gitignored. All defaults work for local document
search: Supabase remains unconfigured, Gemini is disabled when
`GEMINI_API_KEY` is empty, and document indexing uses local files. To enable
assistant answers, add a real key to `backend/.env` (never commit it) and keep
`GEMINI_MODEL` at the default unless you intend to change models. The first
document upload/search loads `intfloat/multilingual-e5-small` and downloads it
into the Hugging Face cache
unless it is already present. To pre-warm the cache, run once:

```powershell
.\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-small')"
```

To run the gated real-model integration test afterwards:

```powershell
$env:CIVICSAATHI_RUN_MODEL_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration -q

# Opt-in LIVE Gemini test: requires a real key and spends an API call.
$env:CIVICSAATHI_RUN_GEMINI_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration/test_gemini_integration.py -q
```

The normal test suite uses `FakeGemini` and never contacts Google. The live test
is separate and is not needed to validate the Day 4 implementation.

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
- Assistant: `POST /api/v1/assistant/ask`

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
| `POST` | `/api/v1/assistant/ask` | Grounded answer with validated citations; no history |

Readiness reports `vector_store: ok` with the indexed passage count and
`gemini: ok` only when `GEMINI_API_KEY` is present. The overall status remains
`degraded` while Supabase is intentionally unconfigured; that is an honest
signal, not a failure. `pending` means "configured but deliberately deferred",
`not_configured` means "no credentials", `error` means "expected to work but
failed". Credential presence is not a live provider health check.

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
| `GEMINI_API_KEY` | empty | Server-side Gemini key; empty disables assistant answers |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model identifier |
| `ASSISTANT_TOP_K` | `5` | Passages retrieved before the evidence gate |
| `ASSISTANT_MIN_SIMILARITY` | `0.30` | Heuristic minimum similarity on top of the Day 3 distance gate |
| `ASSISTANT_MAX_EVIDENCE_CHUNKS` | `5` | Maximum passages included in the prompt |
| `ASSISTANT_MAX_CONTEXT_CHARS` | `12000` | Total excerpt character budget |
| `ASSISTANT_REQUEST_TIMEOUT_SECONDS` | `30` | Gemini SDK request timeout |
| `ASSISTANT_MAX_OUTPUT_TOKENS` | `900` | Generation cap |
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
vectors follow the multilingual-e5 contract. The assistant defaults are bounded;
`ASSISTANT_MIN_SIMILARITY` is a configurable heuristic, not a calibrated measure
of factual truth. Full Day 4 configuration and validation details are in
[`docs/DAY_4_GEMINI.md`](../docs/DAY_4_GEMINI.md).

## Tests and lint

```powershell
python -m pytest
python -m ruff check app tests
python -m ruff format --check app tests
```

**229 unit/API tests pass and 2 integration tests are skipped by default.**
The gated tests are opt-in so no routine test depends on a model download or a
paid Gemini call:

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
- all six document HTTP endpoints and their error envelopes;
- the assistant RAG pipeline with a fake provider: success, EN/ML/HI, no
  evidence, insufficient model output, malformed JSON, wrong language, invalid
  and fabricated citation ids, bounded retry, document filter, provider errors
  and prompt-injection resistance;
- the assistant HTTP contract, validation, safe error codes and no history;
- the lazy Gemini wrapper's schema, error mapping, timeout handling and bounded
  generation configuration (without a network call).

Unit tests use deterministic injectable `FakeEmbedder` and `FakeGemini` peers
with tiny in-memory PDFs, so they need neither the neural model nor a network.
The gated document integration test uses the real
`intfloat/multilingual-e5-small` model to confirm cross-language retrieval. The
separate gated Gemini test uses a real configured key to check a grounded answer
with a valid citation; it never runs by default.

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
│   │   ├── documents.py           # Document upload/list/search/delete contracts
│   │   └── assistant.py           # Assistant request/response/citation contracts
│   ├── routes/
│   │   ├── health.py              # Liveness + readiness
│   │   ├── system.py              # Product metadata
│   │   ├── schemes.py             # Catalogue list/detail
│   │   ├── eligibility.py         # Deterministic eligibility check
│   │   ├── documents.py           # Upload, list, detail, search, delete
│   │   └── assistant.py           # POST /assistant/ask
│   └── services/
│       ├── system_service.py      # Feature registry and health logic
│       ├── scheme_service.py      # Localised list/detail responses
│       ├── eligibility_engine.py  # Pure three-valued DNF evaluator
│       ├── eligibility_service.py # In-memory evaluation over all schemes
│       ├── pdf_extractor.py       # Secure validation + PyMuPDF text extraction
│       ├── chunker.py             # Page-aware overlapping chunker
│       ├── embeddings.py          # Lazy multilingual-e5 embedder
│       ├── document_service.py    # Ingestion, retrieval and deletion orchestration
│       ├── gemini_client.py       # Lazy official SDK wrapper, error mapping
│       ├── assistant_errors.py    # Safe assistant error types and codes
│       └── assistant_service.py   # Evidence gate, grounding and citation validation
├── tests/
│   ├── document_helpers.py        # Tiny PDFs and deterministic FakeEmbedder
│   ├── assistant_helpers.py       # FakeGemini and isolated assistant services
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
│   ├── test_gemini_client.py
│   ├── test_assistant_service.py
│   ├── test_assistant_api.py
│   └── integration/
│       ├── test_documents_integration.py  # Gated real-model test
│       └── test_gemini_integration.py     # Gated LIVE Gemini test
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
- **Untrusted evidence.** Retrieved text is delimited as source material; the
  system instruction forbids following injected instructions, revealing secrets,
  inventing facts and making eligibility decisions.
- **Backend-owned citations.** The model returns only evidence ids. Metadata is
  rebuilt from retrieved passages, invalid ids are discarded, and one corrective
  retry is allowed before an insufficient-evidence response.
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
- **No guaranteed grounded answer.** If the documents lack relevant evidence,
  Gemini fails, or the response cannot be verified, the API says so instead of
  guessing. Generated text must be checked against the cited page.
- **Text-layer quality varies.** Extraction quality follows the PDF's embedded
  text layer; badly encoded official PDFs may yield poor passages.
- **Cosine distance, not factuality.** Retrieval ranks by embedding similarity;
  citizens must verify the passage against the official source.
- **Single-node persistence.** ChromaDB uses a local disk directory; deployment
  needs a mounted volume or a managed replacement.

## Day 4 reference

See [`docs/DAY_4_GEMINI.md`](../docs/DAY_4_GEMINI.md) for the full request and
response contract, RAG pipeline, evidence/citation validation, localized
insufficient-evidence behavior, safety controls and local setup. Eligibility and
scheme lookup remain outside that pipeline; the document retrieval contract
above is the grounding source.
