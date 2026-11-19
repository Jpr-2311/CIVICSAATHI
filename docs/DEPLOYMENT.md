# Deployment — CIVICSAATHI AI

**Target architecture:** Vercel (React/Vite frontend) · Render (FastAPI backend) · persistent disk on Render (ChromaDB, PDFs, JSON registry) · Gemini key on the backend only.

**Status:** deployment-ready configuration; **no live deployment was performed** while writing this document.

## Status labels

| Label | Meaning |
| --- | --- |
| **Implemented** | Code or configuration exists in this repository. |
| **Automated-tested** | Covered by a repository test or validation command that was run. |
| **Manually-tested** | A person performed the step and recorded the result. None below were manually tested during Day 6. |
| **Requires deployment credentials** | Render/Vercel account access, DNS, disks or dashboard environment variables are needed. |
| **Not yet verified** | Cannot be claimed until an actual deployment and smoke test are performed. |

| Area | Status |
| --- | --- |
| Env-based backend configuration | **Implemented**, **Automated-tested** |
| Optional Gemini startup | **Implemented**, **Automated-tested** |
| CORS guards | **Implemented**, **Automated-tested** |
| Persistent storage configuration | **Implemented**, **Automated-tested** |
| Vercel SPA rewrites | **Implemented**, **Not yet verified on Vercel** |
| Render deployment | **Requires deployment credentials**, **Not yet verified** |
| Vercel deployment | **Requires deployment credentials**, **Not yet verified** |
| Live Gemini answers | **Not yet verified** (outbound TLS timeouts in the development environment) |
| Browser/manual smoke tests | **Not manually tested** |

---

## 1. Repository layout used by deployment

```text
backend/                    FastAPI application; set as Render Root Directory
  app/main.py               ASGI entrypoint: app.main:app
  requirements.txt          production dependencies
  .env.example              backend environment template
frontend/                   React/Vite application; set as Vercel Root Directory
  vercel.json               SPA deep-link rewrite
  .env.example              frontend environment template
  dist/                     build output (generated, not committed)
data/sample_schemes/        curated scheme dataset referenced by the backend
docs/DEPLOYMENT.md          this runbook
```

The backend reads the curated dataset from `PROJECT_ROOT/data/sample_schemes/schemes.json` by default. Keep the `data/` directory in the deployed source or set `SCHEME_DATASET_PATH` to an absolute path inside the service filesystem.

---

## 2. Environment variables

### Backend — Render service

| Variable | Required in production | Description |
| --- | --- | --- |
| `ENVIRONMENT` | Yes | Set to `production`. Enables HTTPS-only CORS and persistent-storage guards. |
| `LOG_LEVEL` | No | Default `INFO`. Use `INFO` or `WARNING`; never log secrets. |
| `CORS_ORIGINS` | Yes | Exact comma-separated browser origins, e.g. `https://your-app.vercel.app`. Wildcards are rejected. |
| `PERSISTENT_DATA_DIR` | Yes, recommended | Absolute path on the mounted disk, e.g. `/data/civicsaathi`. ChromaDB and documents are stored in `chroma/` and `documents/` beneath it. |
| `CHROMA_PERSIST_DIR` | Conditional | Absolute override for the vector directory. Not needed when `PERSISTENT_DATA_DIR` is set. |
| `DOCUMENT_STORAGE_DIR` | Conditional | Absolute override for PDFs plus `index.json`. Not needed when `PERSISTENT_DATA_DIR` is set. |
| `DOCUMENT_COLLECTION_NAME` | No | Chroma collection name; default `civicsaathi_government_documents`. |
| `GEMINI_API_KEY` | No | Server-only key. If absent, startup succeeds and assistant requests return `503 assistant_not_configured`. |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash`. |
| `ASSISTANT_REQUEST_TIMEOUT_SECONDS` | No | Default `30`. |
| `ASSISTANT_MAX_OUTPUT_TOKENS` | No | Default `900`. |
| `DOCUMENT_MAX_UPLOAD_BYTES` | No | Default `10485760` (10 MiB). |
| `DOCUMENT_MAX_PAGES` | No | Default `100`. |
| `EMBEDDING_MODEL_NAME` | No | Default `intfloat/multilingual-e5-small`. First use may download the public model. |
| `SUPABASE_URL` | No | Leave empty. Supabase is deliberately deferred. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Leave empty. Never place this in a frontend variable. |

Production startup fails fast if:

- `CORS_ORIGINS` contains `*`, an invalid origin or a non-HTTPS origin;
- neither `PERSISTENT_DATA_DIR` nor **both** absolute storage overrides are configured;
- the configured storage directory cannot be created or opened.

This is intentional: the API must not silently use an ephemeral directory in production.

### Frontend — Vercel

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Full Render backend origin, e.g. `https://your-service.onrender.com`. No trailing slash is required. |

There is deliberately **no localhost fallback** in the browser bundle. If the variable is missing in a production build, API calls fail with a clear `api_base_url_missing` error. `VITE_*` values are public by design: never put `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` or any other secret here.

Changing a Vercel environment variable requires a new deployment/build.

---

## 3. Backend deployment on Render

**Status:** **Requires deployment credentials** · **Not yet verified**

1. Create a Render **Web Service** from the repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to Python 3.11+ (Render's Python runtime).
4. Set **Build Command**:

   ```bash
   pip install -r requirements.txt
   ```

5. Set **Start Command**:

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
   ```

   Use a single worker. The registry lock and in-process service state are process-local; one worker avoids split-brain writes. Scale vertically rather than adding workers until a shared database/store is introduced in a later phase.

6. Add the backend environment variables from section 2 in the Render dashboard.
7. Create and attach a **Persistent Disk**:
   - Name: `civicsaathi-data`
   - Mount Path: `/data`
   - Size: choose according to expected PDF volume (for example 1 GiB for a demo).
8. Set `PERSISTENT_DATA_DIR=/data/civicsaathi`.
9. Deploy. Do not use placeholder values such as `your-service` in a real deployment.

### Persistent disk behavior

**Status:** **Implemented** · **Automated-tested for path resolution and reopen/delete behavior** · **Not yet verified on Render**

With `PERSISTENT_DATA_DIR=/data/civicsaathi`, the backend uses:

```text
/data/civicsaathi/chroma/       ChromaDB persistence
/data/civicsaathi/documents/    Uploaded PDFs and index.json
```

The registry is written atomically to `documents/index.json`. ChromaDB reopens the same collection on restart. Deleting a document removes its vectors, its registry record and its stored PDF together. IDs are server-generated UUID hex values, and path containment is checked before file access.

**Existing local data is not automatically migrated.** Files currently under local `backend/.chroma/` or `backend/data/documents/` are gitignored and are not copied to a Render disk. Upload PDFs again after deploying, or perform a deliberate out-of-band copy while no worker is writing. Keep the Chroma collection and `index.json` from the same snapshot; mixing them can create stale records.

Relative paths in local development resolve against `backend/`, not the shell's current directory, preventing accidental per-directory databases.

---

## 4. Frontend deployment on Vercel

**Status:** **Requires deployment credentials** · **Not yet verified**

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework: **Vite**. Vercel normally detects these values:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set `VITE_API_BASE_URL` to the public Render service URL.
5. Ensure the committed `frontend/vercel.json` is present. It rewrites unknown paths to `/index.html` so React Router routes such as `/app/schemes` survive a refresh or direct link.
6. Deploy and confirm the built bundle contains the Render origin and no localhost fallback.

The frontend uses `BrowserRouter`; do not switch it to hash routing. The SPA rewrite is the deployment-level requirement for deep links.

---

## 5. CORS configuration

**Status:** **Implemented** · **Automated-tested** · **Not yet verified across deployed domains**

Set the Render backend's `CORS_ORIGINS` to the exact Vercel origin:

```text
CORS_ORIGINS=https://your-app.vercel.app
```

Additional explicit origins are comma-separated. Include the correct protocol, host and port. Do not include a trailing wildcard or `*`. The backend rejects wildcard and malformed origins at settings validation time, and production requires HTTPS origins.

CORS uses explicit methods (`GET`, `POST`, `DELETE`, `OPTIONS`) and headers (`Accept`, `Content-Type`) with credentials disabled. If the frontend uses a custom Vercel preview domain, add that exact preview origin or use a dedicated staging service with its own explicit origin list.

---

## 6. Gemini configuration

**Status:** **Implemented** · **Automated-tested for configured/unconfigured startup** · **Live answers not yet verified**

- Store `GEMINI_API_KEY` only in the Render service environment.
- Leave it unset for deployments that do not need generated answers.
- Startup succeeds without it. `/api/v1/health/readiness` reports the `gemini` check as `not_configured`, and `POST /api/v1/assistant/ask` returns `503 assistant_not_configured`.
- Document upload, indexing, search and scheme/eligibility features remain available without Gemini.
- The key is a Pydantic `SecretStr` on the backend, is never returned by an endpoint, and is never logged.
- The typed Gemini SDK schema preserves the existing closed evidence contract.

Do not add a Gemini key to Vercel or any `VITE_*` variable.

---

## 7. Local development

**Status:** **Implemented** · **Automated-tested in the repository**

Backend:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
copy .env.example .env        # Windows; use cp on macOS/Linux
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env        # Windows; use cp on macOS/Linux
npm run dev
```

The example frontend value points at the local backend. Local storage defaults are `backend/.chroma/` and `backend/data/documents/`, resolved relative to `backend/` and gitignored.

Run validation:

```bash
# backend
python -m pytest
python -m ruff check app tests
python -m ruff format --check app tests

# frontend
npm run lint
npm test -- --run
npm run build
```

Three backend integration tests are gated behind opt-in environment flags and are skipped in the default run.

---

## 8. Health-check verification

**Status:** **Implemented** · **Automated-tested for response contracts** · **Not yet verified against deployed URLs**

After deployment:

```bash
curl https://your-service.onrender.com/api/v1/health
curl https://your-service.onrender.com/api/v1/health/readiness
```

Expected:

- `/api/v1/health` returns HTTP 200 with `status: "ok"`.
- `/api/v1/health/readiness` returns HTTP 200 with checks for `api`, `scheme_dataset`, `supabase`, `gemini` and `vector_store`.
- `vector_store` should be `ok` after the persistent disk and collection open successfully.
- `gemini` is `ok` with a key or `not_configured` without one.
- `supabase` remains `not_configured` by design.
- Overall readiness may be `degraded` while Gemini or Supabase is unconfigured; this is honest, not a failure of the API runtime.
- `not_ready` indicates an `error` check, commonly the vector store. Investigate before using upload/search.

Use the Render dashboard's liveness check path `/api/v1/health` if route-level health checks are available. Do not use `/health/readiness` as a hard restart trigger when Gemini is intentionally absent.

---

## 9. Post-deployment smoke tests

**Status:** **Requires deployment credentials** · **Not manually tested** · **Not yet verified**

Perform these in order after a real deployment:

1. **Frontend loads**: open the Vercel URL; confirm the landing page renders in English.
2. **Deep link refresh**: open `https://your-app.vercel.app/app/schemes` directly and refresh. Confirm React renders, not a Vercel 404.
3. **Language switching**: switch EN → ML → HI and back on the same route; confirm copy changes without losing the route.
4. **API connectivity**: open the health URL from section 8; confirm HTTP 200.
5. **Scheme discovery**: load the scheme catalogue and open one scheme detail page.
6. **Eligibility**: submit a harmless test profile and confirm a deterministic result with the preliminary disclaimer.
7. **Upload**: upload a small, text-based official-format PDF. Confirm `status: indexed` and a positive passage count.
8. **Search**: ask an English question about the uploaded PDF. Confirm a passage with document and page metadata.
9. **Cross-language retrieval**: ask a Malayalam question about the English PDF. Confirm relevant passages and citations.
10. **Grounded answer**: with Gemini configured, ask the assistant a question answered by the PDF. Confirm citations are backend-provided and no key appears in responses or logs.
11. **Insufficient evidence**: ask an unrelated question. Confirm the honest no-evidence response and zero citations.
12. **Persistence across restart**: note the uploaded document, restart the Render service, reload the document library and confirm it is still listed with its passage count. This is the critical persistent-disk check.
13. **Delete**: delete the test document and confirm its record, PDF and indexed passages are removed.
14. **CORS**: confirm browser requests succeed from the exact Vercel origin and that no CORS error appears in DevTools.
15. **Optional Gemini absence**: on a staging service without the key, confirm startup succeeds and assistant requests return `assistant_not_configured`.

Record results outside source control. Do not paste API keys, full request headers or sensitive prompts into tickets or screenshots.

---

## 10. Common failures and troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Backend exits at startup with `Production requires PERSISTENT_DATA_DIR` | `ENVIRONMENT=production` without storage config | Mount the disk and set `PERSISTENT_DATA_DIR=/data/civicsaathi`, or set both absolute storage overrides. |
| Backend exits with `Persistent document storage is unavailable` | Disk not mounted, bad mount path, permissions or path is a file | Verify the Render disk mount and that the configured path is writable. |
| Local data disappeared after deployment | Local Chroma/registry files were never migrated | Re-upload PDFs or deliberately copy a consistent Chroma + registry snapshot to the disk. |
| Browser shows CORS error | `CORS_ORIGINS` missing/wrong, preview URL not listed, HTTP origin in production | Add the exact HTTPS Vercel origin and redeploy the backend. Never use `*`. |
| Frontend says `api_base_url_missing` | `VITE_API_BASE_URL` absent during build | Set the Render origin in Vercel and rebuild/redeploy. |
| Frontend API calls reach Vercel instead of Render | Empty or relative API base in a production build | Set a full absolute `VITE_API_BASE_URL`. The app no longer has a localhost fallback. |
| Deep link 404 after refresh | `vercel.json` missing or Root Directory wrong | Ensure `frontend/vercel.json` is deployed and Vercel Root Directory is `frontend`. |
| Readiness `vector_store: error` | Chroma cannot open its persistent directory | Check disk mount, permissions, disk fullness and whether another process is using the same directory. Use one worker. |
| Assistant `503 assistant_not_configured` | No backend Gemini key | Set `GEMINI_API_KEY` on Render only, or accept degraded readiness and document-search-only behavior. |
| Assistant `504 gemini_timeout` | Outbound TLS/provider latency | Retry; verify Render egress and Gemini status. Do not disable TLS verification or weaken evidence validation. |
| First upload is slow or fails to download the model | Embedding model download requires outbound access | Confirm egress to the model host and adequate startup/request time; pre-caching is an optional future improvement. |
| Upload rejected as too large or corrupt | Existing PDF validation limits | Use a text-based PDF within the configured byte/page limits. Scanned PDFs become `needs_ocr`, not searchable. |
| Cached frontend still uses old API URL | Vercel/CDN cache | Redeploy after changing the env var and hard-refresh the browser. |

---

## 11. Security review notes

**Status:** **Implemented** · **Automated-tested where noted**

- `.gitignore` excludes `.env`, `.env.*` (except examples), local ChromaDB data and uploaded documents.
- Secrets are backend `SecretStr` settings; no secret is returned by an endpoint or added to a `VITE_*` variable.
- CORS origins are explicit and validated; wildcards are rejected.
- Uploads have byte and page caps, require real PDF content and use generated identifiers with path containment checks.
- Registry writes are atomic; document deletion removes vectors, record and PDF.
- Validation errors omit submitted values to avoid reflecting identifiers such as Aadhaar numbers.
- Exceptions return safe envelopes; stack traces are logged server-side only.
- No authentication, chat history, Supabase, OCR or new database was introduced in this phase.
- A tracked-file secret scan and `git diff --check` were run before the Day 6 commit; results are recorded in the final report.

---

## 12. What still requires a human

**Requires deployment credentials:**

- Render account, service creation, persistent disk purchase/mount and dashboard environment variables.
- Vercel project creation, Root Directory configuration and `VITE_API_BASE_URL`.
- Exact production domains for `CORS_ORIGINS`.

**Manually-tested:**

- None during Day 6. All smoke tests in section 9 are instructions for the deployer.

**Not yet verified:**

- Actual Render/Vercel deployment success.
- Persistent disk behavior under a real Render restart.
- Vercel SPA rewrites with real deep links.
- Cross-origin browser behavior with real domains.
- Live Gemini generation from the deployed environment.
