# CIVICSAATHI AI — Frontend

React + Vite workspace for the CIVICSAATHI AI civic intelligence assistant.

The Day 2 frontend includes a trilingual public landing page, a live telemetry
dashboard, a searchable verified-scheme catalogue, scheme detail pages and a
deterministic eligibility form. Document intelligence and the assistant remain
honest previews. English, Malayalam and Hindi share one interface and one route
structure.

## Stack

- React 19 + Vite 8 (JavaScript)
- Tailwind CSS 4 via `@tailwindcss/vite`
- React Router 7
- Axios with cancellation and normalized errors
- Lucide icons
- Custom lightweight i18n (no runtime dependency)
- Oxlint for static checks

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

## Routes

| Route | Page | State |
| --- | --- | --- |
| `/` | Landing page | Live |
| `/app` | Workspace dashboard | Live |
| `/app/schemes` | Searchable scheme catalogue | Live |
| `/app/schemes/:schemeId` | Scheme detail | Live |
| `/app/eligibility` | Eligibility checker | Live |
| `/app/documents` | Document intelligence preview | Day 3 |
| `/app/assistant` | AI assistant preview | Day 4 |
| `*` | Not found | Live |

Unknown `/app/*` routes render the 404 page with a route back to the dashboard.

## Languages

The interface ships in English (`en`), Malayalam (`ml`) and Hindi (`hi`).
`LanguageProvider` persists the choice in `localStorage` under
`civicsaathi.language`, updates `<html lang>`, the document title and the meta
description, and falls back to English when the stored value is unknown.

Catalogs live in `src/i18n/messages/`. The English file is the canonical key
schema; add a key to all three catalogs and read it with
`useLanguage().t('flat.key')` or `useMessages()` for structured copy. Indic
scripts use their own display fonts, never synthetic italics.

Scheme and eligibility requests send the current language, so switching
languages refetches localised content. A live eligibility result is re-run
automatically when the language changes.

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
├── App.jsx                        # Route table
├── main.jsx                       # BrowserRouter and language bootstrap
└── index.css                      # Tailwind theme, fonts, wrapping rules
```

## Live screens

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
- Call to action to the eligibility checker.

### Eligibility

- 29 optional fields across five sections, with no Aadhaar, phone, address or
  document-number fields.
- Tri-state yes / no / not sure controls; blank stays unknown.
- Local validation for whole numbers and ranges before any request is sent.
- Privacy copy states that answers are evaluated in memory and never saved.
- Results include outcome counts and filters, per-condition pass/fail/unknown
  explanations, per-route combination status, sources and a disclaimer.

## API integration

`src/services/api.js` centralizes all HTTP access:

- Base URL from `VITE_API_BASE_URL`, trailing slashes removed.
- 12-second timeout.
- `ApiError` with `status` and `code`.
- Human-readable messages for timeouts, unreachable backends, cancellation, API
  errors and unknown failures.
- Helpers: `getHealth()`, `getReadiness()`, `getSystemInfo()`, `getSchemes()`,
  `getScheme()`, `checkEligibility()`, `apiDocsUrl()`.
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

The layout is verified at 1440 px and 390 px in all three languages. The
workspace sidebar becomes an accessible drawer below `lg`, and the marketing
header collapses to a menu button below `md`. Script-aware `overflow-wrap`
prevents long words from forcing horizontal scrolling, while headings are kept
to word-boundary breaks where the copy allows it.

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

Vite reports a chunk-size warning above 500 kB. It is informational on Day 2;
code-splitting is a later hardening task, not a functional issue.

## Next milestone

Day 3 adds the document intelligence experience: PDF upload, ingestion status,
extracted metadata and a reader that keeps page evidence visible. The existing
`Card`, `Button`, `Badge`, `Skeleton`, `Notice` and `EmptyState` primitives are
intended to carry that screen without a redesign.
