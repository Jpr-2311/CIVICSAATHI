# CIVICSAATHI AI — Frontend

React + Vite workspace for the CIVICSAATHI AI civic intelligence assistant.

Day 5 connects the Day 1–4 frontend into a trilingual journey: a public landing
page, a real-data telemetry dashboard, a searchable verified-scheme catalogue,
scheme detail pages, a deterministic eligibility form, live document
intelligence and an evidence-backed assistant with validated backend citations.
English, Malayalam and Hindi share one interface and one route structure.

## Stack

- React 19 + Vite 8 (JavaScript)
- Tailwind CSS 4 via `@tailwindcss/vite`
- React Router 7
- Axios with cancellation and normalized errors
- Lucide icons
- Custom lightweight i18n (no runtime dependency)
- Oxlint for static checks
- Vitest + Testing Library for assistant, dashboard, connected-journey and translation-parity tests

## Setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local   # optional
npm run dev
```

Open <http://localhost:5173>. The backend should be running at
<http://127.0.0.1:8000>; start it with the instructions in
[`backend/README.md`](../backend/README.md).

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Public origin of the FastAPI service |

Only public configuration belongs in `VITE_*` variables; they are embedded in
the browser bundle.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build on port 4173 |
| `npm run lint` | Run Oxlint |
| `npm test` | Run Vitest (assistant UI, Day 5 integration and EN/ML/HI key parity) |

## Routes

| Route | Page | State |
| --- | --- | --- |
| `/` | Landing page | Live |
| `/app` | Workspace dashboard | Live |
| `/app/schemes` | Searchable scheme catalogue | Live |
| `/app/schemes/:schemeId` | Scheme detail | Live |
| `/app/eligibility` | Eligibility checker | Live |
| `/app/documents` | Document intelligence | Live |
| `/app/assistant` | Grounded assistant | Live |
| `*` | Not found | Live |

Unknown `/app/*` routes render the 404 page with a route back to the dashboard.

Day 5 uses query parameters only for UI context: `?scheme_id=<id>` on eligibility,
`?document=<id>` on the assistant and documents pages, and `&page=<n>` when
inspecting a citation. They survive back/forward navigation, are never sent as
API fields and never contain profile answers. A cited excerpt is also passed in
transient router state so it remains visible after a hard reload.

## Languages

The interface ships in English (`en`), Malayalam (`ml`) and Hindi (`hi`).
`LanguageProvider` persists the choice in `localStorage` under
`civicsaathi.language`, updates `<html lang>`, the document title and the meta
description, and falls back to English when the stored value is unknown.

Catalogs live in `src/i18n/messages/`. The English file is the canonical key
schema; add a key to all three catalogs and read it with
`useLanguage().t('flat.key')` or `useMessages()` for structured copy. Indic
scripts use their own display fonts, never synthetic italics.

Scheme, eligibility and assistant requests send the current language. The
assistant answer language follows the selector on its page, which updates the
global app language. Day 5 re-asks the last question in the newly selected
language; if a request is in flight, the re-ask waits until it settles.
Catalog parity is enforced by a committed Vitest test (640 flattened keys in
EN, ML and HI). A live eligibility result and any scheme/document context are
reloaded automatically when the language changes, while the current route and
query parameters are preserved.

## Structure

```text
src/
├── components/
│   ├── brand/Logo.jsx             # Shield mark and wordmark
│   ├── layout/
│   │   ├── AppShell.jsx           # Sidebar, topbar, mobile drawer, outlet
│   │   ├── Sidebar.jsx            # Desktop navigation and mobile panel
│   │   └── Topbar.jsx             # Breadcrumb, API status, menu button
│   ├── marketing/
│   │   ├── SiteHeader.jsx         # Sticky marketing header + mobile menu
│   │   ├── SiteFooter.jsx
│   │   └── AnswerPreview.jsx      # Interactive EN/ML/HI illustrative answer
│   ├── ui/                        # Button, Card, Badge, Skeleton, etc.
│   └── workspace/ModuleHeader.jsx # Shared module page header
├── data/modules.js                # Module status and endpoints
├── hooks/useSystemSnapshot.js     # API polling and request state
├── i18n/
│   ├── LanguageProvider.jsx       # Language state, interpolation, metadata
│   ├── LanguageSwitcher.jsx       # Full and compact select variants
│   ├── context.js                 # React context and hooks
│   ├── languages.js               # Codes, native labels, short labels
│   └── messages/                  # en.js, ml.js, hi.js, index.js
├── lib/
│   ├── cn.js                      # Conditional class helper
│   └── format.js                  # Locale-aware date and number formatting
├── pages/
│   ├── LandingPage.jsx
│   ├── DashboardPage.jsx
│   ├── SchemesPage.jsx
│   ├── SchemeDetailPage.jsx
│   ├── EligibilityPage.jsx
│   ├── DocumentsPage.jsx
│   ├── AssistantPage.jsx
│   └── NotFoundPage.jsx
├── services/api.js                # Axios instance and endpoint helpers
├── test/
│   ├── AssistantPage.test.jsx     # Filter, recovery, citation and language states
│   ├── Day5Integration.test.jsx   # Connected journey and honest-state contracts
│   └── translationParity.test.js  # EN/ML/HI key parity
├── App.jsx                        # Route table
├── main.jsx                       # BrowserRouter and language bootstrap
└── index.css                      # Tailwind theme, fonts, wrapping rules
```

## Live screens

### Dashboard

- Live scheme and document totals from the existing `GET /schemes` and
  `GET /documents` endpoints.
- Readiness-derived count for the three in-scope core services; Supabase is
  excluded because it is deferred.
- Skeleton loading, **Unavailable** on request failure, an empty-library hint
  and a single retry action. No sample activity or hardcoded count remains.
- Quick actions for all four live modules with trilingual copy.

### Scheme catalogue

- 350 ms debounced search across the localised catalogue.
- All nine category chips plus all/central/state government filters.
- 12 records per page with previous/next controls.
- Skeleton loading; a refreshing state keeps the previous page visible.
- Empty state with a clear-filters action; error state with retry.
- Each card shows category, level, summary, benefit highlights, department,
  verification date, source link and a detail link.

### Scheme detail

- Loading skeleton and distinct 404 and generic error states.
- Benefits, documents, application steps, encoded conditions and manual flags.
- Primary and additional official sources with full URLs.
- Content note, verification date and substantial-decision disclaimer.
- Eligibility CTA carrying `?scheme_id=<encoded-id>` into the checker.

### Eligibility

- 34 optional fields across five sections, with no Aadhaar, phone, address or
  document-number fields.
- Tri-state yes / no / not sure controls; blank stays unknown.
- Local validation for whole numbers and ranges before any request is sent.
- Privacy copy states that answers are evaluated in memory and never saved.
- Results include outcome counts and filters, per-condition pass/fail/unknown
  explanations, per-route combination status, sources and a disclaimer.
- A `scheme_id` parameter shows a localised context card, filters the displayed
  results and offers back/clear/show-all routes. The request payload is still
  only profile fields plus `language`; no scheme id is added.

### Documents

- Drag-and-drop or picker upload with progress, status, passage counts, detail,
  confirmation-based deletion and multilingual page-cited search.
- Search filter and assistant handoff include only `indexed` documents;
  `needs_ocr` rows are labelled **Not searchable yet**.
- `?document=<id>` restores a stale or deleted selection with a translated
  warning instead of sending a doomed request.
- A citation handoff renders backend-provided title, page, evidence id and
  excerpt in a source-inspection card. It is not a PDF page preview and adds no
  metadata.

### Assistant

- Optional document filter stored in `?document=<id>`, refreshed on mount and
  tab return, with a document-list error/retry notice.
- The last question is re-asked in the newly selected language; an in-flight
  answer never overrides the new language.
- Expandable backend citations show the excerpt, source, evidence id and an
  **Inspect source** route back to the documents page.
- Explicit loading, insufficient-evidence, timeout/error and stale-document
  states; no answer is invented when retrieval or validation fails.

## API integration

`src/services/api.js` centralizes all HTTP access:

- Base URL from `VITE_API_BASE_URL`, trailing slashes removed.
- 12-second timeout.
- `ApiError` with `status` and `code`.
- Human-readable messages for timeouts, unreachable backends, cancellation, API
  errors and unknown failures.
- Helpers: `getHealth()`, `getReadiness()`, `getSystemInfo()`, `getSchemes()`,
  `getScheme()`, `checkEligibility()`, `listDocuments()`, `getDocument()`,
  `uploadDocument()`, `deleteDocument()`, `searchDocuments()`,
  `askAssistant()`, `apiDocsUrl()`, `toApiError()` and `isCanceled()`.
- Empty or undefined query parameters are removed before sending.
- Requests accept an `AbortSignal`; replaced catalogue requests are aborted and
  cancellation never flashes an error state.

`useSystemSnapshot()` treats health as required and readiness/info as
best-effort using `Promise.allSettled`. The dashboard keeps the last good
snapshot when a later poll fails and shows an offline banner with a retry
action. Polling runs every 30 seconds only while the tab is visible and
refreshes immediately when the tab becomes visible again.

Eligibility answers live only in component state. They are not written to
`localStorage`, cookies or the URL, and are cleared by the "Clear answers"
action.

## Design system

Tokens are declared in `src/index.css` using Tailwind 4's `@theme`:

- `cream-50` … `cream-400` for warm page and surface backgrounds.
- `ink-50` … `ink-950` for warm neutral text and borders.
- `brand-50` … `brand-950` for the deep navy primary.
- `coral-50` … `coral-900` for muted accent and emphasis.
- `teal-50` … `teal-900` for selected states, success and verified evidence.
- Instrument Serif for Latin display headings, Inter for UI, and Noto Sans
  Malayalam / Devanagari for those scripts at display and body sizes.
- `shadow-soft` and `shadow-lift` elevation tokens.

The Day 2 shell was visually verified at 1440 px and 390 px in all three
languages. Day 5 tests assert mobile-first grid and wrapping classes for the new
connected views, but no manual browser verification was performed at 1440, 1280,
768 or 390 px. The workspace sidebar becomes an accessible drawer below `lg`, and
the marketing header collapses to a menu button below `md`. Script-aware
`overflow-wrap` prevents long words from forcing horizontal scrolling, while
headings are kept to word-boundary breaks where the copy allows it.

## Accessibility

- Skip-to-content links on both the marketing page and workspace.
- Visible focus rings via `:focus-visible`.
- Semantic headings, lists, tables, fieldsets, legends and form labels.
- `aria-current`, `aria-expanded`, `aria-controls`, `aria-pressed`,
  `aria-busy` and `aria-live` where relevant.
- Invalid eligibility fields use `aria-invalid` and focus moves to the first
  invalid control.
- Mobile navigation closes on Escape and locks background scroll.
- Live loading states use text, not colour alone.

## Build and deploy

```powershell
npm run build
npm run preview
```

For Vercel: set the project root to `frontend`, build with `npm run build`,
publish `dist`, and set `VITE_API_BASE_URL` to the deployed API origin. Add an
SPA rewrite to `index.html` if the host does not handle client-side routes.

Vite reports a chunk-size warning above 500 kB. It is informational; code
splitting is a later hardening task, not a functional issue.

## Next milestone

Day 6 covers evaluation, failure-mode hardening and accessibility/performance
checks. Day 5 details, validation results and the mocked-versus-live Gemini
distinction are in [`docs/DAY_5_INTEGRATION.md`](../docs/DAY_5_INTEGRATION.md).
