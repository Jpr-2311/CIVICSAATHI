# CIVICSAATHI AI — Demo Script

**Target length:** 4 minutes 30 seconds to 5 minutes
**Track:** NxtWave IDEA//FORGE — Civic Pulse
**Demo mode:** local build, real API, real uploaded government PDF

> **Before you present:** live Gemini generation was **not verified** during final
> testing. Do not promise a live AI answer. Use the conditional assistant segment
> below and fall back to document retrieval if the provider fails.

---

## Pre-demo checklist (5 minutes before)

- [ ] Backend running at `http://127.0.0.1:8011`; `/api/v1/health` returns 200.
- [ ] `/api/v1/health/readiness` shows `scheme_dataset=ok`,
      `vector_store=ok`; `gemini` may be `ok` (key present) or
      `not_configured`. Readiness may be `degraded` because Supabase is deferred.
- [ ] Frontend production build running at `http://127.0.0.1:4173`.
- [ ] The official PM-KISAN PDF is already uploaded and `indexed` (12 pages,
      33 passages). The first upload can take ~24 seconds; do not make the
      audience wait for it on stage.
- [ ] One English, one Malayalam and one Hindi document search has been tested.
- [ ] Browser is in English, at 100% zoom, with no API key or `.env` tab visible.
- [ ] Backup open: `docs/screenshots/documents-library-desktop.png` and
      `docs/screenshots/eligibility-results-desktop.png`. If the live API fails,
      say clearly that you are showing a local capture, not a live result.

**Backup document search:** `What documents are required for PM-KISAN registration?`
**Backup Malayalam search:** `PM-KISAN രജിസ്ട്രേഷന് ആവശ്യമായ രേഖകൾ ഏതെല്ലാം?`
**Backup Hindi search:** `PM-KISAN पंजीकरण के लिए कौन से दस्तावेज़ आवश्यक हैं?`

---

## 0:00 – 0:25 | The hook

**On screen:** landing page, hero section.

**Say:**

> “A scheme can exist. A family can qualify. And the information can still be
> unreachable. Government help is often spread across portals, PDFs and English
> notifications — and a confident chatbot answer is not the same as a sourced one.
> CIVICSAATHI AI is a trilingual civic workspace that connects schemes, eligibility
> and official documents — with evidence you can check.”

Do not open with architecture. Open with the citizen's problem.

---

## 0:25 – 1:00 | Language is a first-class feature

**Do:** on the landing page, switch **English → മലയാളം → हिन्दी → English** using
the language control. Open `/app` and show that the route and language persist.

**Say:**

> “English, Malayalam and Hindi are not a translation afterthought. The whole
> workspace changes language, and the same multilingual embedding model lets a
> Malayalam question retrieve an English official passage.”

Keep this under 35 seconds. The point is access, not animation.

---

## 1:00 – 1:40 | Dashboard and scheme discovery

**Do:**

1. Open the workspace dashboard. Point to API online, 15 verified schemes and the
   indexed document count.
2. Click **Find schemes**.
3. Search `PM-KISAN` or filter by **Agriculture**.
4. Open **Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)**.

**Say:**

> “This is a curated catalogue, not a web scrape. Every record carries an official
> source and a verification date. We can see benefits, documents, application
> steps and the encoded conditions — without inventing a scheme or a link.”

Point to the **Official source** and **Last verified** labels. Mention that 15
schemes are curated and validated; do not imply national coverage.

---

## 1:40 – 2:20 | Deterministic eligibility

**Do:**

1. Click **Check your eligibility** from the PM-KISAN detail page, or open
   `/app/eligibility`.
2. Enter a harmless profile: age `34`, state `Kerala`, area `Village or rural
   area`, category `General`, annual income `120000`, Indian citizen `Yes`, holds
   agricultural land `Yes`, bank account `Yes`.
3. Submit **Check eligibility**.
4. Show the outcome counts and the preliminary disclaimer.

**Say:**

> “The language model does not decide this. A deterministic, three-valued rules
> engine evaluates the encoded conditions and explains pass, fail and unknown.
> Missing answers stay unknown instead of becoming ‘no.’ The strongest outcome is
> ‘potentially eligible,’ never a final government decision. The answers are
> evaluated in memory and never stored.”

If asked why the demo profile produced mostly “manual review” or “more information
needed”: that is the honest design. Conditions that require official verification
are not guessed.

---

## 2:20 – 3:10 | Official PDF and page-cited retrieval

**Do:**

1. Open **Read documents**. Show the PM-KISAN document row: `indexed`, 12 pages,
   33 passages.
2. Optionally click **Document details** and show the metadata, then close it.
3. In **Search your documents**, run the English question. Point to the filename
   and page number on the first result.
4. Switch the workspace language to **മലയാളം**, return to Documents, and run the
   Malayalam question on the same English PDF. Point to page 9 again.

**Say:**

> “This is a real official PM-KISAN guidelines PDF. The server extracted it page
> by page, chunked it with page metadata, and indexed it with multilingual
> embeddings. We are not generating an answer here — these are actual passages from
> the document. The Malayalam query retrieves the English passage because both
> languages share the same embedding space. Every result points to a page a human
> can verify.”

Do **not** claim the PDF is current beyond its official source. Do not invent a
deadline or benefit. If the document row is missing, re-upload a text-based
official PDF and explain that the first upload also downloads the embedding model.

---

## 3:10 – 4:00 | Grounded assistant and honest failure

**Do (conditional):**

1. Open **Ask CivicSaathi**.
2. Ask: `What documents are required for PM-KISAN registration?`
3. If a live answer appears, expand the citation and show the page-9 source.
4. If the request fails or times out, **do not retry repeatedly** and do not
   improvise an answer. Say:

> “The assistant is deliberately evidence-gated: it retrieves passages first, and
> it will not invent an answer when the provider fails. That is the correct
> behavior. The document retrieval path we just saw remains available without
> Gemini, and the assistant returns a safe failure instead of a fabricated one.”

5. Then open Documents and run the English search again to close the loop on
   evidence.

**Say (whether or not the live answer succeeds):**

> “The backend owns the citations. The model only returns evidence ids; titles,
> pages and excerpts come from the retrieved passage. If the evidence is missing,
> it says so. If the provider is unavailable, it does not guess. That is the
> difference between a demo and a civic tool.”

**If Gemini is not configured at all:** the assistant returns
`503 assistant_not_configured`. Say that document search and the rest of the
workspace still work without the key.

---

## 4:00 – 4:30 | Why this matters

**On screen:** return to the dashboard or landing page.

**Say:**

> “CIVICSAATHI AI separates three things that are usually blurred together:
> rules decide eligibility, retrieval supplies evidence, and the model only helps
> explain bounded evidence. The result is a civic tool that can say ‘here is the
> rule, here is the page, and here is what I do not know.’ That is how we make
> government information accessible without making it less trustworthy.”

Mention the social impact in one sentence: farmers, artisans, students and
frontline helpers can get a sourced starting point in the language they think in.

---

## 4:30 – 4:50 | Close

**Say:**

> “We built a trilingual journey from scheme discovery to a cited page, with a
> deterministic eligibility engine and a no-evidence path that refuses to guess.
> The local journey is verified; deployment and live Gemini generation are the
> next steps, and we will not claim them until they are tested. Thank you — I’m
> happy to take questions.”

Stop talking. Let the judges ask.

---

## Likely questions and short answers

**“Why not just use ChatGPT?”**
> Because a general model can invent a scheme or a deadline. Here, eligibility is
> deterministic, documents are user-supplied official PDFs, citations are built by
> the backend, and the system is allowed to say it has insufficient evidence.

**“Does Gemini decide eligibility?”**
> No. Eligibility is pure Python over encoded rules. The model never returns an
> eligibility outcome.

**“Is this deployed?”**
> No. Deployment is prepared for Render and Vercel, but credentials and account
> access were unavailable. We did not fabricate a URL. The local journey,
> persistence and deletion were verified.

**“Did the live AI answer work?”**
> Not during final verification. The provider calls timed out, so we tested and
> demonstrated the evidence retrieval, the safe failure state and the no-evidence
> path. We are not claiming a live answer we did not see.

**“What happens if a document does not contain the answer?”**
> Retrieval returns `has_evidence: false`, and the assistant returns
> `insufficient_evidence: true` with zero citations. It asks for the relevant
> document instead of guessing.

**“What about privacy?”**
> Eligibility answers are evaluated in memory and never stored. There is no
> authentication, chat history or profile persistence in this prototype. Secrets
> stay on the backend; the browser bundle contains no Gemini key.

**“What is next?”**
> Verify live generation, deploy with a persistent Render disk and exact HTTPS
> CORS, add OCR for scanned notices, expand the verified catalogue, and test
> accessibility and low-bandwidth behavior.
