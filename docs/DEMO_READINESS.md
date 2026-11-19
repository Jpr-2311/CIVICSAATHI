# Demo readiness — CIVICSAATHI AI

**Status:** Day 5.1 stabilisation · **Last updated:** 19 November 2026

This checklist prepares a reliable hackathon demonstration of the existing Day 5
application. It does not introduce Day 6 work, change product logic, or claim
that the manual browser steps below have already been performed.

Markers:

- **[A]** — covered by an automated test or command in this repository.
- **[M]** — requires a human to perform the step in a browser or terminal.
- **[L]** — requires a configured Gemini key **and** reachable provider network.

No API key, prompt, response body or request header should be pasted into notes,
screenshots, chat or source control during the demo.

---

## 0. Preconditions [M]

From the repository root, confirm:

```powershell
git status --short
git log -1 --oneline
```

Expected: clean working tree and a Day 5.1 commit on top of
`9ee9eb3 Day 5: connect modules into one trilingual journey`.

You need:

- `backend/.venv` with `requirements-dev.txt` installed.
- `frontend/node_modules` from `npm install`.
- The curated dataset at `data/sample_schemes/schemes.json`.
- A text-based official PDF for the upload check. Scanned-only PDFs correctly
  become `needs_ocr` and are not searchable.

A Gemini key is optional. Without it, the app still starts and every module
except live answer generation remains usable.

---

## 1. Start the backend [M]

From the repository root:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Expected: Uvicorn reports application startup complete. A missing
`GEMINI_API_KEY` must **not** crash startup.

[A] Regression coverage: `tests/test_startup_configuration.py`.

---

## 2. Start the frontend [M]

In a second terminal, from the repository root:

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173>. Keep the backend terminal visible so startup and
request errors are obvious during the demo.

---

## 3. Verify backend health and readiness [M/A]

```powershell
curl http://127.0.0.1:8000/api/v1/health
curl http://127.0.0.1:8000/api/v1/health/readiness
```

Expected:

- `/health` returns `status: "ok"`.
- `/health/readiness` reports `scheme_dataset` and `vector_store` as `ok`.
- `supabase` is `not_configured` because it is intentionally deferred.
- `gemini` is `ok` with a key, or `not_configured` without one.

Do not paste the full readiness response into a screenshot; it is safe, but
verbose.

[A] `tests/test_api.py` and `tests/test_startup_configuration.py`.

---

## 4. Open scheme discovery [M]

Open <http://localhost:5173/app/schemes>.

Check:

- 15 verified schemes load from the API.
- Search, category and government-level filters work.
- Empty search shows an honest empty state.
- The dashboard quick action reaches the same catalogue.

[A] `tests/test_schemes_api.py`, `tests/test_day5_integration.py`.

---

## 5. Open a scheme and check potential eligibility [M]

1. Open <http://localhost:5173/app/schemes/pm-kisan>, or click **PM-KISAN**.
2. Confirm benefits, documents, steps, sources and verification date render.
3. Click **Check your eligibility**.
4. Confirm the URL becomes
   `/app/eligibility?scheme_id=pm-kisan`.
5. Enter a simple profile such as `age = 34` and submit.
6. Confirm the selected scheme is shown first and a **Show all schemes** action
   exists.
7. Optional: in browser DevTools → Network, inspect the
   `POST /api/v1/eligibility/check` request body. It must contain profile fields
   and `language` only — no `scheme_id`, Aadhaar, phone, address or document
   number.

Expected: deterministic results with pass/fail/unknown explanations and the
preliminary-result disclaimer.

[A] `tests/test_eligibility.py`, `tests/test_day5_integration.py`.

---

## 6. Upload an official text-based government PDF [M]

1. Open <http://localhost:5173/app/documents>.
2. Choose a small, text-based official notice PDF.
3. Drag it onto the upload area or use the file picker.
4. Wait for the progress indicator to finish.

Expected: the document appears in the library without an upload error. Invalid
or oversized files show the server's safe rejection code.

[A] `tests/test_pdf_extractor.py`, `tests/test_documents_api.py`.

---

## 7. Confirm indexing [M]

In the document library row, check:

- status is `indexed`;
- indexed passage count is greater than zero;
- **Ask about this PDF** is available.

If the PDF has no extractable text, status is `needs_ocr`, passage count is `0`,
and the row says **Not searchable yet**. This is correct behaviour, not a failed
upload.

[A] `tests/test_document_service.py`, `tests/test_day5_integration.py`.

---

## 8. Ask an English question [M/L]

1. Click **Ask about this PDF** on the indexed row, or open
   `/app/assistant?document=<document-id>`.
2. Ask: `What documents must a farmer submit?`
3. Confirm the selected document remains in the URL and selector.

Expected with reachable Gemini: an answer with at least one backend-validated
citation.

Expected without reachable Gemini: a safe `gemini_timeout` or
`gemini_unavailable` error notice and no fabricated answer.

[A] `tests/test_assistant_api.py`, `tests/test_assistant_service.py`,
`tests/test_day5_integration.py`.

[L] `tests/integration/test_gemini_integration.py` is opt-in.

---

## 9. Ask a Malayalam question about English source material [M/L]

With the same English PDF selected, ask:

`കർഷകർക്ക് ആവശ്യമായ രേഖകൾ എന്തൊക്കെയാണ്?`

Expected with reachable Gemini: a Malayalam answer grounded in the English PDF
passages, with citations. Cross-language retrieval is covered by the mocked
suite and the gated real-model document test; live generation depends on
provider access.

---

## 10. Inspect citations and page numbers [M]

1. Expand a returned citation.
2. Check that only backend-provided filename, page, evidence id and excerpt are
   shown.
3. Click **Inspect source**.
4. Confirm the route becomes
   `/app/documents?document=<document-id>&page=<n>` and that the citation card
   shows the same excerpt.

Important: this is a source-inspection card, **not** a PDF page preview. There
is no invented URL, page or metadata. If the cited document was deleted, the
excerpt stays visible with an explicit missing-document warning.

[A] `tests/test_day5_integration.py`, `tests/test_assistant_api.py`,
`tests/test_assistant_service.py`.

---

## 11. Test an unsupported question [M]

Ask something unrelated to the uploaded documents, for example:

`What is the weather forecast for Mars?`

Expected: the honest insufficient-evidence response, zero citations, and no
Gemini call. The assistant must not invent an answer.

[A] `tests/test_assistant_api.py::test_insufficient_evidence`.

---

## 12. Test behaviour without a Gemini key [M/A]

This is optional during the live demo because the automated regression covers
it. To perform it manually:

```powershell
# Stop the backend first (Ctrl+C in its terminal).
Remove-Item Env:\GEMINI_API_KEY -ErrorAction SilentlyContinue
Rename-Item backend\.env backend\.env.with-key
```

Restart the backend using step 1, then check:

```powershell
curl http://127.0.0.1:8000/api/v1/health/readiness
curl -X POST http://127.0.0.1:8000/api/v1/assistant/ask -H "Content-Type: application/json" -d "{\"question\":\"farmer support\"}"
```

Expected:

- startup succeeds;
- readiness `gemini.check.status` is `not_configured`;
- assistant returns HTTP `503` with code `assistant_not_configured`;
- schemes, eligibility, documents and search still work.

Restore the environment after the check:

```powershell
# Stop the backend, then:
Rename-Item backend\.env.with-key backend\.env
```

Never print the value of `GEMINI_API_KEY` or rename it to a file that gets
committed.

[A] `tests/test_startup_configuration.py`.

---

## 13. Test mobile layout and language switching [M]

Use browser DevTools device emulation at 390 px, 768 px, 1280 px and 1440 px.

Check:

- the workspace sidebar becomes an accessible drawer below `lg`;
- dashboard cards and action grids wrap without horizontal overflow;
- Malayalam and Hindi copy renders without clipped headings;
- switching EN → ML → HI in the topbar preserves the current route and query
  string;
- scheme/document context reloads in the new language;
- the assistant re-asks the last question in the new language and does not show
  an answer from the previous language.

These visual checks have **not** been performed as part of Day 5.1. Frontend
tests assert class composition and route/state behaviour only.

---

## Automated validation commands [A]

From the repository root:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest --override-ini="addopts=" -q
.\.venv\Scripts\python.exe -m ruff check app tests
.\.venv\Scripts\python.exe -m ruff format --check app tests

cd ..\frontend
npm run lint
npm test -- --run
npm run build
```

Translation parity is included in the frontend suite: EN, ML and HI must each
have 640 flattened keys.

Live Gemini is deliberately excluded from the default suite. To attempt it:

```powershell
cd backend
$env:CIVICSAATHI_RUN_GEMINI_TESTS = '1'
.\.venv\Scripts\python.exe -m pytest tests/integration/test_gemini_integration.py -q
Remove-Item Env:\CIVICSAATHI_RUN_GEMINI_TESTS
```

Do not describe a live check as passing unless both tests pass and the output
is retained outside source control.

---

## Live Gemini status at Day 5.1

The key is configured, DNS resolves, verified TLS to
`generativelanguage.googleapis.com` succeeded in a direct probe, and the SDK
version is `3.5.0`. The client configuration is `gemini-2.5-flash`, a 30-second
timeout and 900 max output tokens.

A schema serialisation defect was found and fixed: the raw schema dict caused
`400 INVALID_ARGUMENT` for `additional_properties`; the client now passes the
typed SDK `Schema` object with the same validation rules.

Live end-to-end checks were retried after that fix and still failed before a
provider response with:

```text
httpcore2.ConnectTimeout: _ssl.c:983: The handshake operation timed out
app.services.assistant_errors.GeminiTimeoutError: The AI service took too long to respond.
```

One earlier attempt also produced `httpcore2.ReadTimeout` on the first test.
The failure is therefore treated as intermittent outbound network/provider
access, not a passing live validation. Real Gemini remains **unverified** in
this environment; mocked end-to-end validation is green.

---

## Remaining limitations

- Supabase is intentionally unconfigured and reported as `degraded`.
- There is no PDF byte or page-image endpoint; citation inspection shows
  backend metadata only.
- OCR is out of scope: scanned PDFs are stored as `needs_ocr` and excluded from
  search.
- No manual browser verification is claimed in this document.
