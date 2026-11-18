# Curated scheme dataset

`schemes.json` is the source of truth for the scheme catalogue and the
deterministic eligibility engine. It is read by `SchemeRepository`, validated by
Pydantic at load time, and served by `GET /api/v1/schemes` and
`GET /api/v1/schemes/{id}`.

**Dataset version:** 3 · **Curated and verified:** 16 November 2026 ·
**Corrected and re-verified:** 18 November 2026
**Contents:** 15 schemes (10 central, 5 Kerala) · 53 reusable conditions
(44 profile-checked, 9 manual)

---

## 1. Trust rules

These rules are normative. A change that breaks one should be rejected in
review.

1. **Official sources only.** Every `source` and `additional_sources` entry must
   pass `app/core/source_policy.py`: HTTPS, no credentials, the default HTTPS
   port, and a host on the reviewed allowlist. A blanket `.gov.in` / `.nic.in`
   suffix test is deliberately not used; see §5.
2. **No invented schemes, benefits, amounts, conditions or URLs.** If a detail
   cannot be confirmed on an official page, it is omitted from the dataset or
   represented as a manual condition — never guessed.
3. **Every record carries provenance.** Each record stores a primary source
   (title, publisher, URL, verification date) and a record-level `verified_on`
   date. Additional official pages are stored in `additional_sources`.
4. **No unverified filler.** The dataset contains no demo or sample records. If
   the file is missing, empty or invalid, the repository reports it as
   unavailable and readiness returns `error`; the API never substitutes
   plausible-looking content.
5. **Translations are labelled.** English is the verified editorial summary.
   Malayalam and Hindi are editorial interface translations, not official
   translations, and the API repeats that note in every response.

The catalogue is a demonstration service. It is **not** an official
eligibility decision.

---

## 2. Schemes

| id | Scheme | Level | Category | Manual check |
| --- | --- | --- | --- | --- |
| `pm-kisan` | Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) | central | agriculture | — |
| `pm-vishwakarma` | PM Vishwakarma | central | business | — |
| `atal-pension-yojana` | Atal Pension Yojana (APY) | central | pension | — |
| `pmjjby` | Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) | central | insurance | — |
| `pmsby` | Pradhan Mantri Suraksha Bima Yojana (PMSBY) | central | insurance | — |
| `pm-svanidhi` | PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi) | central | business | ULB vendor record |
| `mgnrega` | Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS) | central | employment | — |
| `ignoaps` | Indira Gandhi National Old Age Pension Scheme (IGNOAPS) | central | pension | — |
| `pm-jay` | Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY) | central | health | SECC / state list route |
| `pmay-urban` | Pradhan Mantri Awas Yojana – Urban 2.0 (PMAY-U 2.0) | central | housing | Pucca house, 20-year allotment, female ownership and vertical checks |
| `kasp` | Karunya Arogya Suraksha Padhathi (KASP) | state | health | State beneficiary list |
| `snehapoorvam` | Snehapoorvam | state | education | — |
| `samaswasam` | Samaswasam | state | health | — |
| `vayomithram` | Vayomithram | state | welfare | Project area |
| `snehasanthwanam` | Snehasanthwanam | state | welfare | Endosulfan victim list |

Every scheme appears in all three languages. `keywords` holds extra search
terms (for example abbreviations and department names) used by the repository's
NFKC-normalised, case-insensitive search.

---

## 3. File shape

```json
{
  "version": 3,
  "updated_at": "2026-11-18",
  "note": "Curated on 2026-11-16 and corrected on 2026-11-18 …",
  "conditions": { "<condition_id>": { … } },
  "schemes": [ { … } ]
}
```

### 3.1 Scheme record

```json
{
  "id": "pm-kisan",
  "name": { "en": "…", "ml": "…", "hi": "…" },
  "short_name": { "en": "…", "ml": "…", "hi": "…" },
  "summary": { "en": "…", "ml": "…", "hi": "…" },
  "description": { "en": "…", "ml": "…", "hi": "…" },
  "category": "agriculture",
  "government_level": "central",
  "department": { "en": "…", "ml": "…", "hi": "…" },
  "benefits": [ { "en": "…", "ml": "…", "hi": "…" } ],
  "documents_required": [ { "en": "…", "ml": "…", "hi": "…" } ],
  "application_steps": [ { "en": "…", "ml": "…", "hi": "…" } ],
  "source": {
    "title": "…",
    "publisher": "…",
    "url": "https://…",
    "verified_on": "2026-11-18"
  },
  "additional_sources": [ { "title": "…", "publisher": "…", "url": "https://…", "verified_on": "2026-11-18" } ],
  "verified_on": "2026-11-18",
  "keywords": ["…"],
  "rule": { "any_of": [ { "all_of": ["condition_id", "…"] } ] }
}
```

- `category` is one of `agriculture`, `business`, `education`, `employment`,
  `health`, `housing`, `insurance`, `pension`, `welfare`.
- `government_level` is `central` or `state`. State records also carry `state`.
- Translation objects must contain all three language keys; Pydantic rejects a
  partial object.

### 3.2 Condition library

Conditions are defined once and reused across schemes. A profile condition
names an allowlisted profile field, an operator and an expected value:

```json
{
  "id": "age_18_to_40",
  "kind": "profile",
  "label": { "en": "Your age is between 18 and 40 years", "ml": "…", "hi": "…" },
  "field": "age",
  "operator": "between",
  "value": [18, 40]
}
```

Supported operators: `eq`, `neq`, `gte`, `lte`, `gt`, `lt`, `between`, `in`,
`truthy`, `falsy`. String comparisons are trimmed and case-folded.

A manual condition has `kind: "manual"` and no field or operator:

```json
{
  "id": "manual_kasp_list",
  "kind": "manual",
  "label": { "en": "…", "ml": "…", "hi": "…" }
}
```

Manual conditions always evaluate to `unknown` with
`reason: "manual_verification_required"`. They are used where the official rule
depends on a government list, a project area, a SECC entry or an inspection
that the citizen's answers cannot establish. They never become a pass.

### 3.3 Rule shape (DNF)

```json
"rule": {
  "any_of": [
    { "all_of": ["indian_citizen", "age_70_or_above"] },
    { "all_of": ["manual_pmjay_secc"] }
  ]
}
```

A scheme is a disjunction of routes. Any one route being satisfied makes the
scheme `potentially_eligible`. Within a route:

- one failed condition → route `failed`;
- otherwise one unknown manual condition → route `manual_review`;
- otherwise one unknown profile condition → route `insufficient_information`;
- otherwise → route `satisfied`.

Scheme outcome:

| Any route | Result |
| --- | --- |
| `satisfied` | `potentially_eligible` |
| `manual_review` | `manual_review` |
| `insufficient_information` | `insufficient_information` |
| all `failed` | `ineligible` |

This ordering is why a partially evaluable application cannot be reported as
eligible: an unverified mandatory manual route forces manual review instead of
being ignored. PM-JAY, for example, has a verified universal 70+ route plus a
manual SECC/state-list route.

The engine never assumes a missing answer. An omitted profile field is
`unknown` (`missing_profile_field`), not `false` and not `true`.

---

## 4. Verified source allowlist

`app/core/source_policy.py` owns the allowlist and the rationale for each
domain. A URL must match a listed domain exactly or be a subdomain of it.

| Domain | Why it is trusted |
| --- | --- |
| `pmkisan.gov.in` | PM-KISAN portal and operational guidelines |
| `pmvishwakarma.gov.in` | PM Vishwakarma portal and guidelines |
| `pfrda.org.in` | PFRDA, statutory regulator for APY |
| `jansuraksha.gov.in` | Jan Suraksha portal (PMJJBY, PMSBY, APY) |
| `pmsvanidhi.mohua.gov.in` | PM SVANidhi portal, Ministry of Housing and Urban Affairs |
| `nregaplus.nic.in` | NIC-hosted MGNREGA document library |
| `nrega.dord.gov.in` | MGNREGA programme site, Department of Rural Development |
| `nsap.dord.gov.in` | National Social Assistance Programme site |
| `pib.gov.in` | Official Government of India press releases |
| `pmay-urban.gov.in` | PMAY-U 2.0 operational guidelines, Ministry of Housing and Urban Affairs |
| `pmaymis.gov.in` | PMAY-U management information system |
| `sha.kerala.gov.in` | Kerala State Health Agency (KASP) |
| `socialsecuritymission.gov.in` | Kerala Social Security Mission (four state schemes) |

The policy rejects HTTP, embedded credentials, non-default ports and unknown
hosts. Query strings and fragments are allowed because several government pages
identify a scheme through a query parameter.

PFRDA (`pfrda.org.in`) and the Kerala Social Security Mission are the reason a
suffix rule is insufficient: both are legitimate official sources outside
`.gov.in` / `.nic.in`, while a suffix rule would also accept any unrelated host
that happens to end in those strings.

---

## 5. Verification protocol

For each scheme, the editor:

1. Opened the primary official source over HTTPS and confirmed the scheme name,
   administering department and current benefit.
2. Cross-checked eligibility conditions and exclusions against the same source
   or a second official page, recorded in `additional_sources`.
3. Encoded only conditions that can be evaluated from the allowlisted profile,
   or marked the remainder as manual conditions.
4. Recorded the verification date on both the source and the scheme.
5. Ran the dataset tests, which re-validate every record, URL, condition
   reference, rule route and translation key.

Twelve corrected records carry `verified_on: "2026-11-18"`. The three records
left unchanged by the Day 2.1 audit (`pm-vishwakarma`, `mgnrega` and
`vayomithram`) retain their original `verified_on: "2026-11-16"`. Re-verify
before extending the dataset; do not copy a date forward without reopening the
source.

---

## 6. Validation and tests

From `backend/`:

```powershell
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m ruff format --check .
```

Dataset-specific guarantees covered by `tests/test_scheme_dataset.py` and
`tests/test_source_policy.py`:

- the file parses and validates against `SchemeDataset`;
- ids are unique and every rule references an existing condition;
- every scheme has at least one route and every route has at least one
  condition;
- every URL passes the official-source policy;
- every translation has `en`, `ml` and `hi`;
- manual conditions never carry a field or operator;
- the source policy rejects HTTP, credentials, ports and unknown hosts.

API and engine behaviour is covered by `tests/test_schemes_api.py` and
`tests/test_eligibility.py`.

---

## 7. Adding or changing a scheme

1. Re-verify the official page and note the date.
2. Add or reuse conditions in `conditions`; do not duplicate a condition with a
   different meaning under the same id.
3. Add the scheme record with all three languages, benefits, documents,
   application steps and at least one source.
4. Encode `rule.any_of`. Use a manual condition for any official requirement
   that cannot be evaluated faithfully from the profile.
5. Add keywords that citizens would actually type.
6. Run the tests and Ruff. A dataset validation failure is a hard failure, not
   a warning.

Do not add a scheme to fill the catalogue. An absent record is honest; an
invented one is not.
