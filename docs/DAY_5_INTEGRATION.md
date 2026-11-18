# Day 5 — Connected trilingual journey

**Status:** implemented and wired · **Version:** 0.2.0 · **Last updated:** 18 November 2026

Day 5 connects the modules shipped on Days 1–4 into one citizen journey. It adds
no backend feature, no new API field and no new provider: the existing scheme,
eligibility, document and assistant endpoints are reused. The work is a frontend
integration and polish layer plus cross-module contract tests and documentation.

> **Validation honesty:** the default automated suite mocks Gemini with
> `FakeGemini`. A separate opt-in live Gemini check was retried during Day 5
> validation but could not complete because outbound TLS handshakes timed out
> before the provider responded. This document distinguishes mocked validation
> from that unavailable live check throughout.

---

## 1. What is connected

| Journey | Entry point | Handoff | Backend used |
| --- | --- | --- | --- |
| Dashboard → any module | `/app` | Quick-action links | Existing snapshot, `GET /schemes`, `GET /documents` |
| Scheme → eligibility | Scheme detail CTA | `/app/eligibility?scheme_id=<id>` | `GET /schemes/{id}`, unchanged `POST /eligibility/check` |
| Documents → assistant | Indexed document row or library hint | `/app/assistant?document=<id>` | `GET /documents`, unchanged `POST /assistant/ask` |
| Assistant → source inspection | Expanded backend citation | `/app/documents?document=<id>&page=<n>` plus transient router state | `GET /documents/{id}`; no new page-preview endpoint |

The query parameters are **browser-side handoffs only**. They are not part of
any request body. Browser back/forward restores the route and the selected
context; no eligibility profile is written to the URL, browser storage or global
state.

---

## 2. Dashboard: real data, honest states

The dashboard now retrieves its own counts instead of showing decorative
numbers:

- `getSchemes({ page: 1, page_size: 1, language })` supplies `total` for
  **Verified schemes**.
- `listDocuments()` supplies the library length for **Documents indexed**.
- Readiness checks `scheme_dataset`, `vector_store` and `gemini` supply the
  `readyServices / 3` service summary. Supabase is excluded because it is
  intentionally deferred.

Each metric has explicit `loading`, `ready` and `error` states. A failed count
shows **Unavailable**, never `0` or an estimate. An empty document library shows
an explanatory hint, and a single **Retry totals** action reloads both counts.
The old sample-activity panel was removed. The assistant quick action is now
labelled live, matching the existing feature registry.

The dashboard continues to use the `AppShell` snapshot for health, readiness,
latency, polling and offline handling. The two count requests are independent:
a document-library failure does not hide the verified scheme count.

---

## 3. Scheme context into eligibility

`SchemeDetailPage` appends `?scheme_id=<encoded-id>` to its existing eligibility
CTA. `EligibilityPage` reads that parameter and:

1. calls the existing `getScheme(id, { language })` to render a small context
   card with the scheme name, summary, retry and back links;
2. filters the returned eligibility results by `scheme_id` for display;
3. offers **Show all schemes**, which keeps the same result set and only changes
   the visible subset;
4. clears or reloads the context when the parameter or language changes;
5. handles a wrong or unavailable scheme id with a distinct error state.

The submission payload is unchanged. It still contains only the allowlisted
profile fields and `language`; `scheme_id` is never added. No eligibility data
is sent to Gemini, and the assistant pipeline is not involved in this flow.
Backend contract tests assert that an explicit `scheme_id` in
`POST /api/v1/eligibility/check` is still rejected with `422 validation_error`.

---

## 4. Document library into assistant

The document library derives its search filter and assistant selector from the
same indexed-only rule:

- Only records with `status === 'indexed'` appear in the search filter and the
  assistant document selector.
- An indexed row exposes **Ask about this PDF**, which opens
  `/app/assistant?document=<id>`.
- `needs_ocr` and other non-indexed rows show **Not searchable yet** and cannot
  be handed off or filtered into a search.
- The assistant refreshes the library on mount and when the tab becomes visible,
  and exposes a retry notice when the list request fails.

Both pages recover from stale selections. If a document is missing or is no
longer indexed, the URL parameter is removed with `replace: true` and a
translated warning explains that the document was deleted or is not searchable.
If a question was already in flight when the document disappeared, the backend
`404 document_not_found` response triggers the same recovery and refresh.

---

## 5. Citations and source inspection

Citations remain exactly what the backend builds from retrieved passages:

```json
{
  "evidence_id": "e1",
  "document_id": "doc-7f...",
  "document_title": "farm-notice.pdf",
  "page": 4,
  "excerpt": "Applicants must submit an income certificate."
}
```

The assistant shows the excerpt, source filename, evidence id and an **Inspect
source** link. That link routes back to the document library with
`document=<id>&page=<n>` and passes the citation object through router state.
The library renders a source-inspection card containing only that metadata and
offers a route back to the assistant.

Important limits:

- There is no PDF byte endpoint and no page-image endpoint. The card is a
  lightweight source-inspection view of backend metadata, not a PDF preview.
- No URL, page number, title or excerpt is invented by the frontend. Metadata
  absent from the backend response is not displayed.
- Citation validation proves **document-level provenance** of a passage. It
  does not prove the factual truth of the generated claim; the existing
  similarity disclaimer and official-source advice remain visible.

---

## 6. Language and navigation parity

All new interface copy exists in English, Malayalam and Hindi. The parity test
compares the flattened key sets of all three catalogs and now enforces **640
keys per language**.

- `LanguageProvider` persists the selected language and updates document
  metadata; route paths and query parameters are unchanged by a language switch.
- Scheme context and document context are reloaded in the new language through
  the existing localised endpoints.
- The assistant re-asks the last question in the newly selected language. If a
  request is in flight, the re-ask is queued until it settles, so only the
  language-appropriate answer is rendered.
- The same back links, active navigation states, titles, loading indicators,
  empty states, error notices and retry actions are used in all three languages.

---

## 7. Test coverage

### 7.1 Mocked default suite (green)

| Layer | File | Day 5 coverage |
| --- | --- | --- |
| Frontend | `src/test/Day5Integration.test.jsx` | Real/error dashboard totals, no fake activity, scheme→eligibility payload safety, document→assistant handoff, citation inspection, stale citation recovery, language context preservation, mobile-first grid classes |
| Frontend | `src/test/AssistantPage.test.jsx` | Stale URL selection, `document_not_found`, citation link state, document-list error/retry, language re-ask with context preserved |
| Frontend | `src/test/translationParity.test.js` | Exact EN/ML/HI key and array-length parity |
| Backend | `tests/test_day5_integration.py` | Scheme-detail→eligibility contract, indexed filtering and `needs_ocr`, document-filtered citations, stale selection, fabricated metadata rejection, shared fixture pin |

The backend cross-module tests use the real curated dataset and temporary
document stores with `FakeEmbedder`/`FakeGemini`. They replace only `app.state`
services and restore them afterwards. No backend route, model or validation rule
was changed to make these tests pass.

### 7.2 Opt-in live Gemini check (unavailable in this environment)

`tests/integration/test_gemini_integration.py` now contains two gated live cases:
the Day 4 English grounded-answer case and a new document-filtered Malayalam
case. Both are skipped unless `CIVICSAATHI_RUN_GEMINI_TESTS=1` is set.

With a configured key present, the gate was retried during Day 5 validation.
Both cases failed before a model response with:

```text
httpcore2.ConnectTimeout: _ssl.c:983: The handshake operation timed out
app.services.assistant_errors.GeminiTimeoutError: The AI service took too long to respond.
```

This is an external network/TLS limitation, not a mocked-test failure and not a
claim that live Gemini output was verified. The key was not printed or stored in
the repository. Re-run the opt-in command on a network with provider access to
complete live validation.

---

## 8. Validation performed

```powershell
# Backend — mocked default suite
cd backend
.\.venv\Scripts\python.exe -m pytest --override-ini="addopts=" -q
.\.venv\Scripts\python.exe -m ruff check app tests
.\.venv\Scripts\python.exe -m ruff format --check app tests

# Frontend
cd frontend
npm run lint
npm test -- --run
npm run build
```

Final Day 5 results:

- Backend: **233 passed, 3 skipped** (the three skips are the gated real-model
  document test and the two gated live Gemini tests).
- Ruff check and format check: clean.
- Frontend: **20 tests passed** across three files; Oxlint clean; Vite
  production build succeeds (with the pre-existing informational chunk-size
  warning).
- Translation parity: 640 flattened keys in each of EN, ML and HI.
- Live Gemini: attempted twice, blocked by outbound TLS timeout; not passing.

No manual browser verification was performed for the new Day 5 layouts. The
frontend tests assert mobile-first class composition and route/state behaviour;
they do not replace visual inspection at 1440, 1280, 768 or 390 px.

---

## 9. Boundaries kept

- No backend route, Pydantic model, eligibility rule or citation rule changed.
- `EligibilityRequest` still has `extra="forbid"` and no `scheme_id`.
- No eligibility value is sent to Gemini or persisted anywhere.
- All privileged calls still go through the existing `/api/v1` boundary.
- No secret was added to the repository, a `VITE_*` variable, a log line or a
  test assertion.
- No fake activity, hardcoded counts, invented citations, invented URLs or
  invented PDF page previews were introduced.
- Day 6 (evaluation/hardening) and Day 7 (deployment) were not started.

---

## 10. Known out-of-scope observation

The existing `backend/app/main.py` startup path calls `.get_secret_value()` on
the Gemini secret when it is entirely absent. Day 5 did not change startup
behaviour; the configured development environment used for validation has a key
present. Treat this as a pre-existing hardening item, not a Day 5 regression.
