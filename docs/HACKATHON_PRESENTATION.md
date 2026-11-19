# CIVICSAATHI AI — Hackathon Presentation

**NxtWave IDEA//FORGE — Civic Pulse track**

A multilingual civic intelligence prototype for Kerala. This document is a
presentation narrative: each section can become a slide, with speaker notes and
only the claims that the build can support.

> **Status honesty:** the local product journey is verified. The project is not
> deployed, and live Gemini generation was not verified during final testing
> (provider calls timed out). The presentation must not claim otherwise.

---

## 1. The problem

Government support often exists on paper while remaining unreachable in practice.

A family may qualify for a scheme and still fail to find it. A farmer may hold the
right documents and still not know which office accepts them. A student may find a
notification in English and need it in Malayalam. A citizen may read a confident
chatbot answer that was never checked against an official source.

The gap is not only information. It is **translation, navigation, eligibility and
trust** at the same time.

**One-line framing:**

> A scheme can exist, a family can qualify, and the information can still be
> unreachable.

---

## 2. Why government information is difficult to access

1. **Fragmentation.** Schemes live across central ministries, state departments,
   portals and PDF notifications. Search results mix old notices with current
   rules.
2. **Language.** Official documents are often English-first. Malayalam and Hindi
   readers must translate legal and administrative language before they can act.
3. **Eligibility complexity.** A scheme can combine age, income, occupation,
   landholding, category and exclusions. A keyword search cannot answer “do I
   qualify?”
4. **Document burden.** Even after finding a scheme, citizens must identify the
   right documents and the right page of a long notification.
5. **Trust.** A plausible answer is not the same as a sourced answer. Generic
   language models can invent benefits, deadlines and eligibility rules.

The design response is not “a bigger chatbot.” It is a system that separates
**rules**, **retrieval** and **generation**, and keeps a source beside every claim.

---

## 3. The CIVICSAATHI AI solution

CIVICSAATHI AI is a trilingual workspace with five connected capabilities:

| Capability | What it does |
| --- | --- |
| Scheme discovery | Searches a curated catalogue of 15 central and Kerala schemes by name, department, category and government level |
| Scheme detail | Shows benefits, documents, application steps, encoded conditions and official sources with a verification date |
| Eligibility check | Runs a deterministic rules engine over optional profile answers and returns a preliminary outcome with reasons |
| Document intelligence | Validates and indexes an official PDF, then retrieves real passages with filename and page number in English, Malayalam or Hindi |
| Grounded assistant | Retrieves evidence first, then asks Gemini for an answer constrained to those passages; citations are built by the backend |

The interface is available in **English, Malayalam and Hindi** on every route. The
chosen language survives navigation.

**What makes it civic rather than generic:** the system is allowed to say “I do not
know,” it never lets the model decide eligibility, and it never presents an
unsourced answer as fact.

---

## 4. Multilingual RAG architecture

```text
PDF upload
  → content and size validation
  → PyMuPDF text extraction, page by page
  → page-aware overlapping chunks
  → multilingual-e5-small embeddings
  → ChromaDB collection

Question
  → language and input validation
  → multilingual query embedding
  → nearest passages (optionally scoped to one document)
  → evidence-quality gate
  → bounded prompt with untrusted passages
  → structured Gemini response (evidence ids only)
  → backend validates ids and builds citations
  → answer + filename + page + excerpt
```

Key decisions:

- **Cross-lingual retrieval.** `intfloat/multilingual-e5-small` embeds English
  document passages and Malayalam or Hindi questions in one vector space. A
  Malayalam question can retrieve an English official passage.
- **Page-aware chunks.** Every chunk retains its page number, so a citation points
  to a page a human can inspect.
- **Bounded context.** Retrieval count, context characters and output tokens are
  capped. The model cannot wander through an unbounded document dump.
- **Server-only secrets.** The Gemini key lives on the backend. The browser bundle
  contains no key and no provider call.
- **No evidence, no model call.** If retrieval does not clear the evidence gate,
  the assistant returns an honest insufficiency response immediately.

**Verified in final testing:** a real 12-page PM-KISAN guidelines PDF produced 33
chunks. English, Malayalam and Hindi queries each returned five evidence passages;
the first passage was page 9 in all three cases, with similarities 0.8698, 0.8617
and 0.8531. The same document and page-9 evidence survived a backend restart.

---

## 5. The deterministic eligibility engine

Eligibility is the highest-risk claim in a civic product, so it is deliberately
not generated by a language model.

- Rules are data-driven and encoded in the validated scheme dataset.
- The evaluator uses **three-valued logic**: pass, fail or unknown.
- Conditions are combined as routes (disjunctive normal form), with per-condition
  explanations.
- Missing answers stay `unknown`; they are never silently treated as “no.”
- Outcomes are `potentially_eligible`, `ineligible`, `insufficient_information` or
  `manual_review`. The system never returns a bare “eligible.”
- Official checks that cannot be automated force `manual_review`.
- Profile answers are evaluated in memory and are not stored.

**Verified in final testing:** a harmless test profile with eight answers produced
deterministic results across all 15 schemes: 0 potentially eligible, 4 manual
review, 8 more information needed and 3 not eligible.

The model may explain a document. It does not decide a citizen's eligibility.

---

## 6. Evidence-backed citations

Trust is a product feature, not a disclaimer at the bottom.

1. The retrieval layer returns real chunks with a document id, filename, page
   number and excerpt.
2. The prompt gives the model only bounded evidence and asks for evidence ids.
3. The backend validates every returned id against the retrieved set.
4. Titles, pages and excerpts are copied from the retrieved passage by the
   backend, not generated by the model.
5. Fabricated ids are discarded. The UI exposes the cited page and a link back to
   the document view.
6. If the evidence is insufficient, the answer says so and returns zero citations.

**Verified failure behavior:** with no indexed documents, the assistant returned
`insufficient_evidence: true` with zero citations, and document search returned
`has_evidence: false`. With a document present, live model calls returned
`504 gemini_timeout`; the product showed a safe failure state rather than inventing
an answer. That is the correct behavior, even though it means live generation is
not yet verified.

---

## 7. Technical differentiation

| Typical demo | CIVICSAATHI AI |
| --- | --- |
| One chatbot over the open web | Curated, source-linked scheme records plus user-uploaded official PDFs |
| Model decides eligibility | Pure-Python deterministic rules; model never decides |
| Citation added after generation | Evidence retrieved first; backend owns citation metadata |
| English-only | First-class English, Malayalam and Hindi UI and cross-lingual retrieval |
| Answers when unsure | Explicit insufficient-evidence state; no model call without evidence |
| Key in the browser | Server-side secret only; no provider key in the bundle |
| “It works on my machine” | Reproducible test suite, real PDF journey, restart persistence, deletion and no-key mode verified |

The differentiator is not the model. It is the **trust architecture** around the
model: bounded evidence, deterministic decisions, provenance and honest failure.

---

## 8. Social impact

CIVICSAATHI AI is designed for citizens who are least served by English-first
portals:

- **Farmers and farming families** checking income support, documents and
  exclusions.
- **Artisans and small traders** looking for credit, toolkits or welfare support.
- **Students and families** navigating scholarships and education schemes.
- **Frontline helpers** — ASHA workers, panchayat staff, CSC operators and
  volunteers — who can use the workspace to find a sourced answer with a citizen.

The impact is not “more information.” It is **less wrong information**, fewer
wasted office visits, and a citation a citizen can verify. Malayalam and Hindi are
treated as first-class product languages, not an afterthought translation layer.

For a civic tool, accessibility is also trust: a confident wrong answer can cost a
family time, money or a benefit. The design optimizes for verifiable help over
fluent guessing.

---

## 9. Limitations and future scope

### What is not verified or not built

- **Live Gemini generation:** four final calls returned `504 gemini_timeout`.
  Answer quality and live bilingual generation remain unverified.
- **Deployment:** no Render or Vercel deployment exists. Production URLs, CORS
  across real domains, Vercel deep-link rewrites and Render disk persistence are
  unverified.
- **Supabase:** deferred. Readiness is expectedly `degraded` while it is
  unconfigured.
- **OCR:** not implemented. Scanned PDFs are flagged `needs_ocr` rather than being
  silently treated as searchable.
- **Catalogue size:** 15 schemes. Malayalam and Hindi scheme text is editorial
  interface translation, not an official translation.
- **Scale:** single-worker storage assumptions; no authentication, history or
  multi-user accounts by design.
- **Frontend bundle:** 628 kB minified, above Vite's 500 kB warning threshold.

### Future scope

1. Verify live Gemini generation and add a provider-health fallback that keeps
   retrieval available.
2. Deploy the backend with a persistent disk and the frontend with an exact HTTPS
   origin; run the full post-deployment smoke test.
3. Add OCR for scanned notifications, with explicit extraction confidence.
4. Expand the verified catalogue and add official Malayalam source documents
   where available.
5. Add accessibility testing with screen readers and low-bandwidth testing.
6. Introduce a reviewed, opt-in persistence layer (for example Supabase) without
   storing eligibility profiles by default.
7. Add human-review workflows for schemes with manual conditions.

---

## Demo close

> CIVICSAATHI AI does not ask citizens to trust a model. It shows the rule, the
> source, the page and the uncertainty.

That is the idea worth presenting: **government information, without the maze —
and without the guesswork.**
