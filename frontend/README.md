# CIVICSAATHI AI — Frontend

React + Vite workspace for the CIVICSAATHI AI civic intelligence assistant.

The Day 1 frontend includes a trilingual public landing page, the workspace
shell, a live telemetry dashboard and honest previews for the modules that
arrive on later days. English, Malayalam and Hindi share one interface and one
route structure.

## Stack

- React 19 + Vite 8 (JavaScript)
- Tailwind CSS 4 via `@tailwindcss/vite`
- React Router 7
- Axios with normalized errors
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
| `/app/schemes` | Scheme discovery preview | Day 2 |
| `/app/eligibility` | Eligibility checker preview | Day 2 |
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
│   └── workspace/ModuleHeader.jsx # Shared preview-page header
├── data/modules.js                # Module status and endpoints
├── hooks/useSystemSnapshot.js     # API polling and request state
├── i18n/
│   ├── LanguageProvider.jsx       # Language state, interpolation, metadata
│   ├── LanguageSwitcher.jsx       # Full and compact select variants
│   ├── context.js                 # React context and hooks
│   ├── languages.js               # Codes, native labels, short labels
│   └── messages/                  # en.js, ml.js, hi.js, index.js
├── lib/cn.js                      # Conditional class helper
├── pages/
│   ├── LandingPage.jsx
│   ├── DashboardPage.jsx
│   ├── SchemesPage.jsx
│   ├── EligibilityPage.jsx
│   ├── DocumentsPage.jsx
│   ├── AssistantPage.jsx
│   └── NotFoundPage.jsx
├── services/api.js                # Axios instance and endpoint helpers
├── App.jsx                        # Route table
├── main.jsx                       # BrowserRouter and language bootstrap
└── index.css                      # Tailwind theme, fonts, wrapping rules
```

## API integration

`src/services/api.js` centralizes all HTTP access:

- Base URL from `VITE_API_BASE_URL`, trailing slashes removed.
- 12-second timeout.
- `ApiError` with `status` and `code`.
- Human-readable messages for timeouts, unreachable backends, API errors and
  unknown failures.
- Helpers: `getHealth()`, `getReadiness()`, `getSystemInfo()`, `apiDocsUrl()`.

`useSystemSnapshot()` treats health as required and readiness/info as
best-effort using `Promise.allSettled`. The dashboard keeps the last good
snapshot when a later poll fails and shows an offline banner with a retry
action. Polling runs every 30 seconds only while the tab is visible and
refreshes immediately when the tab becomes visible again.

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

The layout is verified at 1440 px, 390 px and 320 px in all three languages.
The workspace sidebar becomes an accessible drawer below `lg`, and the marketing
header collapses to a menu button below `md`. Script-aware `overflow-wrap`
prevents long words from forcing horizontal scrolling, while headings are kept
to word-boundary breaks where the copy allows it.

## Accessibility

- Skip-to-content links on both the marketing page and workspace.
- Visible focus rings via `:focus-visible`.
- Semantic headings, lists, tables and form labels.
- `aria-current`, `aria-expanded`, `aria-controls` and `aria-pressed` where
  relevant.
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

## Next milestone

Day 2 replaces the scheme and eligibility previews with real screens backed by
`GET /api/v1/schemes` and `POST /api/v1/eligibility/check`. The existing
`Card`, `Button`, `Badge`, `Skeleton` and `StatusDot` primitives are intended to
carry those screens without a redesign.
