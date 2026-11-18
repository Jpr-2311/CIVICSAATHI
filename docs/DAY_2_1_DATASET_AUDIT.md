# Day 2.1 — Scheme Dataset Audit and Correction

**Date:** 18 November 2026
**Dataset version:** 3 (previous: 2)
**Scope:** all 15 curated records in `data/sample_schemes/schemes.json`
**Outcome:** 12 records corrected and re-verified; 3 records left unchanged

This document records the Day 2.1 audit of the scheme catalogue. It is the
companion to the dataset policy in
[`data/sample_schemes/README.md`](../data/sample_schemes/README.md) and the
system design in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 1. Audit result at a glance

| Scheme | Prior status | Final status | Verification date |
| --- | --- | --- | --- |
| PM-KISAN | FAIL | PASS (corrected) | 2026-11-18 |
| PM Vishwakarma | PASS | PASS (unchanged) | 2026-11-16 |
| Atal Pension Yojana (APY) | FAIL | PASS (corrected) | 2026-11-18 |
| PMJJBY | WARNING | PASS (corrected) | 2026-11-18 |
| PMSBY | WARNING | PASS (corrected) | 2026-11-18 |
| PM SVANidhi | FAIL | PASS (corrected) | 2026-11-18 |
| MGNREGS | PASS | PASS (unchanged) | 2026-11-16 |
| IGNOAPS | WARNING | PASS (corrected) | 2026-11-18 |
| AB PM-JAY | WARNING | PASS (corrected) | 2026-11-18 |
| PMAY-U 2.0 | FAIL | PASS (corrected) | 2026-11-18 |
| KASP | WARNING | PASS (corrected) | 2026-11-18 |
| Snehapoorvam | FAIL | PASS (corrected) | 2026-11-18 |
| Samaswasam | FAIL | PASS (corrected) | 2026-11-18 |
| Vayomithram | PASS | PASS (unchanged) | 2026-11-16 |
| Snehasanthwanam | WARNING | PASS (corrected) | 2026-11-18 |

"PASS" means the record's encoded rules, amounts, boundaries, sources and
trilingual wording match the cited official sources to the extent verifiable
without a government-list lookup. It does **not** mean an official eligibility
decision: nine conditions still require manual verification and never become a
silent pass (see §5).

Dataset totals after correction:

- **15 schemes** — 10 central, 5 Kerala.
- **53 conditions** — 44 profile-checked, 9 manual (version 2 had 45: 38 profile, 7 manual).
- **34 form fields** on the eligibility page, matching the 34 distinct profile
  fields used by the dataset exactly (no missing or form-only fields).

---

## 2. Corrections to the six FAIL records

### 2.1 PM-KISAN (`pm-kisan`)

Official basis: PM-KISAN portal and the Revised PM-KISAN Operational Guidelines
(`pmkisan.gov.in`).

- Replaced the over-broad "government employee" exclusion with the categories
  the guidelines actually name: constitutional post holders, ministers, MPs,
  MLAs, MLCs, mayors and district-panchayat chairpersons — for the family, not
  only the applicant.
- Added coverage of serving **and retired** government, public-sector,
  autonomous-body and local-body employees, with the guideline's MTS / Class IV
  / Group D exemption.
- Changed the income-tax test to the **last assessment year** rather than any
  lifetime tax-payer status.
- Corrected the pension boundary from `monthly_pension <= 10000` to
  `monthly_pension < 10000`. A pension of exactly ₹10,000 is now correctly
  **excluded**.
- Rule now has 7 conditions (was 6). The stale `government_employee` condition
  was removed from the scheme rule and is no longer treated as an exclusion.

### 2.2 Atal Pension Yojana (`atal-pension-yojana`)

Official basis: PFRDA APY page (`pfrda.org.in`).

- Replaced the household "income tax payer" bar with the correct **individual,
  lifetime** income-tax-payer bar. New condition `never_income_tax_payer` checks
  the new `ever_income_tax_payer` profile field.
- A taxpayer in the last assessment year only (but never an income-tax payer)
  is no longer wrongly rejected; a lifetime payer is now correctly rejected.
- Age 18–40, savings bank account and no duplicate enrolment were confirmed
  unchanged.

### 2.3 PM SVANidhi (`pm-svanidhi`)

Official basis: PIB releases `PRID=2288503` and `PRID=2303797`; the operational
guidelines were used as the factual basis for details that the citable PIB pages
summarise.

- Added the **18+ age** requirement (`age_18_or_above`).
- Added the **unique, valid UPI ID** requirement (`svanidhi_unique_upi_id`).
- Replaced the incorrect "no unpaid similar loan" denial with the guideline's
  actual bar: an existing loan account that is an **NPA or written off**
  (`no_loan_npa_or_written_off`).
- Replaced the incorrect mandatory `urban_resident` condition with a **manual
  ULB-coverage check** (`manual_svanidhi_ulb`), because eligibility follows the
  notified municipal area and includes census towns and peri-urban areas that a
  simple urban/rural answer cannot establish.
- Removed the revoked-certificate portal (`pmsvanidhi.mohua.gov.in`) as a cited
  source; see §7 for the reason.

### 2.4 PMAY-U 2.0 (`pmay-urban`)

Official basis: the PMAY-U 2.0 Operational Guidelines
(`pmay-urban.gov.in/uploads/guidelines/Operational-Guidelines-of-PMAY-U-2.pdf`)
and the PMAY-U MIS (`pmaymis.gov.in`).

- Rewrote the record to describe the **currently active PMAY-U 2.0**, including
  its four verticals: BLC, AHP, ARH and ISS.
- Encoded the EWS / LIG / MIG income bands with the correct overall ceiling of
  ₹9 lakh (`annual_income_up_to_900000`, `lte` 900000); the lower EWS (₹3 lakh)
  and LIG (₹6 lakh) bands remain documented in the text and verified via the
  applicable-vertical manual condition.
- Added the **20-year prior-allotment bar** and **female-ownership rule** as
  manual conditions, plus the pucca-house and vertical checks.
- Updated the display name and short name to include "2.0" in English,
  Malayalam and Hindi, matching the summary, description, steps and sources.
- Added `pmay-urban.gov.in` to the reviewed source allowlist.

### 2.5 Snehapoorvam (`snehapoorvam`)

Official basis: Kerala Social Security Mission (`socialsecuritymission.gov.in`).

- Extended the student condition from school/preschool only to **degree and
  professional-degree courses** via the new `degree_or_professional` education
  value; condition renamed `student_up_to_degree`.
- Corrected the APL income boundaries from inclusive to strict: rural
  `< ₹20,000` and urban `< ₹22,375` (`lt`, not `lte`). Exactly ₹20,000 (rural)
  and exactly ₹22,375 (urban) are now correctly **excluded**.

### 2.6 Samaswasam (`samaswasam`)

Official basis: Kerala Social Security Mission (`socialsecuritymission.gov.in`).

- Added the missing **five-year post-transplant window**
  (`transplant_within_5_years`: `years_since_transplant <= 5`). A transplant
  more than five years ago no longer qualifies through the transplant route.
- The existing dialysis, haemophilia and sickle-cell routes were confirmed
  unchanged.

---

## 3. Corrections to the six WARNING records

### 3.1 PMJJBY (`pmjjby`)

- Added the official **30-day non-accidental-death lien** wording and the
  **age-55 renewal** wording to the record text. The encoded route (age 18–50,
  bank account, auto-debit consent, no duplicate enrolment) is unchanged.
- Fixed the source URL from `www.jansuraksha.gov.in` to the canonical
  `https://jansuraksha.gov.in/...` rules PDF. The `www` host fails with
  `SEC_E_WRONG_PRINCIPAL` on Windows.

### 3.2 PMSBY (`pmsby`)

- Only the canonical non-`www` `jansuraksha.gov.in` source URL fix was needed.
  The encoded route (age 18–70, bank account, auto-debit consent, no duplicate
  enrolment) is unchanged.

### 3.3 IGNOAPS (`ignoaps`)

- Added the official NSAP FAQ (`https://nsap.dord.gov.in/circular.do?method=faq`)
  as an additional source, confirming the 60+/BPL/citizenship criteria.
  The encoded rule is unchanged.

### 3.4 AB PM-JAY (`pm-jay`)

- Added **Indian citizenship** to both routes, so a non-citizen is now
  correctly `ineligible` rather than potentially eligible.
- Broadened the manual SECC route guidance to cover ASHA / AWW / AWH-based
  identification as described in the official material.
- Refreshed the state-coverage wording.
- Corrected the Malayalam summary wording from "above 70" to
  "70 വയസ്സോ അതിൽ കൂടുതലോ" ("70 years or above"), so the inclusive boundary
  is correct in every language.
- Replaced the stale `PRID=1738169` citation with PIB `PRID=2053883` and added
  `PRID=2290627`.

### 3.5 KASP (`kasp`)

- Removed the unsupported claim that there is "no age or family-size limit";
  it was not stated on the cited official page.
- Replaced it with a sourced benefit statement. The encoded route (Kerala
  resident + manual KASP list) is unchanged.

### 3.6 Snehasanthwanam (`snehasanthwanam`)

- Explicitly separated the ₹700 caregiver allowance as an **Aswasakiranam**
  benefit rather than attributing it to Snehasanthwanam itself. The encoded
  manual endosulfan-list route is unchanged.

---

## 4. Records left unchanged

PM Vishwakarma, MGNREGS and Vayomithram passed the prior audit and no
officially supported correction was identified. Their rules, sources, wording
and `verified_on: "2026-11-16"` dates were deliberately preserved.

---

## 5. Manual-review conditions (never a silent pass)

Nine conditions remain manual. They always evaluate to `unknown` with reason
`manual_verification_required`, force the overall result to `manual_review`,
and can never produce `potentially_eligible` on their own:

| Condition | Scheme | Why manual |
| --- | --- | --- |
| `manual_pmjay_secc` | PM-JAY | SECC / ASHA / AWW / AWH list-based identification |
| `manual_svanidhi_ulb` | PM SVANidhi | Notified municipal area (incl. census towns / peri-urban) |
| `manual_pmay_no_pucca_house` | PMAY-U 2.0 | House ownership anywhere in India |
| `manual_pmay_no_allotment_20_years` | PMAY-U 2.0 | Prior allotment in the last 20 years |
| `manual_pmay_female_ownership` | PMAY-U 2.0 | Female head ownership / co-ownership with exceptions |
| `manual_pmay_vertical` | PMAY-U 2.0 | Applicable vertical and its income sub-band |
| `manual_kasp_list` | KASP | Government beneficiary list |
| `manual_vayomithram_area` | Vayomithram | Notified project area |
| `manual_endosulfan_list` | Snehasanthwanam | Endosulfan-affected family list |

Three-valued logic is preserved throughout: a failed condition fails its route;
an unknown manual condition yields `manual_review`; an unknown profile condition
yields `insufficient_information`; only a fully satisfied route yields
`potentially_eligible`. Unknown or unverifiable conditions are never treated as
a pass.

---

## 6. Model, form and translation changes

New `EligibilityRequest` / profile fields, all defaulting to `None` (unknown):

- `ever_income_tax_payer` — APY lifetime tax-payer bar.
- `excluded_government_job` — PM-KISAN serving/retired employee exclusion.
- `constitutional_post_holder` — PM-KISAN constitutional-post exclusion.
- `unique_upi_id` — PM SVANidhi UPI requirement.
- `loan_npa_or_written_off` — PM SVANidhi loan-bar requirement.
- `years_since_transplant` — Samaswasam five-year window.

New education value: `degree_or_professional`.

`similar_loan_unrepaid` is retained in the backend contract for compatibility
but is no longer referenced by any dataset rule or frontend question.

The eligibility form now renders all 34 dataset profile fields and no
form-only fields. Every new label, option and validation message was added in
English, Malayalam and Hindi. The `income_tax_payer` label was clarified to
"last assessment year" in all three languages, and the `transplant_patient`
label now reads "kidney or liver transplant" in all three languages.

Boundary values, income limits and age ranges are identical in EN / ML / HI in
both the dataset and the interface.

---

## 7. Sources and limitations

### 7.1 Source changes

- Added allowlist domain `pmay-urban.gov.in` (PMAY-U 2.0 guidelines).
- PM SVANidhi now cites PIB `PRID=2288503` and `PRID=2303797` instead of the
  revoked-certificate portal.
- PM-JAY now cites PIB `PRID=2053883` and `PRID=2290627`; stale
  `PRID=1738169` removed.
- PMJJBY / PMSBY now cite canonical `https://jansuraksha.gov.in/...` URLs.
- IGNOAPS adds the NSAP FAQ source.

TLS verification and the HTTPS source allowlist were **not** weakened. No URL,
amount, fact or rule was invented.

### 7.2 Known limitations

- **PM SVANidhi detail pages:** the age, UPI and NPA/write-off details are
  stated on the now-revoked certificate portal, which fails Windows TLS with
  `CRYPT_E_REVOKED`. The facts were confirmed against the official operational
  guidelines but are cited through PIB releases because those are the citable
  official pages that load reliably. The portal was not added back and TLS was
  not relaxed.
- **Manual conditions:** nine rules depend on government lists, notified areas,
  SECC entries or inspections that an answer cannot establish. They yield
  `manual_review`, never a pass.
- **PMAY-U 2.0 income sub-bands:** the engine encodes the overall ₹9 lakh
  ceiling; the EWS (₹3 lakh) and LIG (₹6 lakh) sub-bands are documented in the
  record text and checked through the `manual_pmay_vertical` condition.
- **Samaswasam 6+ years post-transplant:** the transplant route fails, but the
  other routes remain unknown for a profile that only answers the transplant
  fields, so the correct three-valued outcome is `insufficient_information`
  (not `ineligible`).
- **Translations** are editorial, not official government translations. English
  is the verified editorial source of record.
- The deterministic engine is a demonstration aid and is **not** an official
  eligibility decision.

---

## 8. Verification performed

All checks were run from the repository root on 18 November 2026.

| Check | Command | Result |
| --- | --- | --- |
| Backend tests | `.venv\Scripts\python.exe -m pytest -q` (in `backend/`) | **150 passed** |
| Ruff lint | `.venv\Scripts\python.exe -m ruff check .` | All checks passed |
| Ruff format | `.venv\Scripts\python.exe -m ruff format --check .` | 28 files already formatted |
| Frontend lint | `npm run lint` (oxlint) | Passed |
| Frontend build | `npm run build` (vite) | Passed (informational chunk-size warning only) |
| API smoke | live uvicorn on `127.0.0.1:8000` | Passed |

API smoke coverage: `GET /api/v1/health` (`ok`), `GET /api/v1/health/readiness`
(`degraded`, dataset `ok`), `GET /api/v1/system/info` (`en,ml,hi`),
`GET /api/v1/schemes` (15 schemes), `GET /api/v1/schemes/pm-kisan`
(`verified_on = 2026-11-18`, 7 conditions), `GET /api/v1/schemes?q=kisan`, and
`POST /api/v1/eligibility/check` in both English (PM-JAY age-70 route →
`potentially_eligible`) and Malayalam (PM-KISAN route →
`potentially_eligible`).

Regression tests were added for every corrected boundary and missing condition:
strict pension `< ₹10,000`; lifetime vs. last-year tax status; PM SVANidhi age
18, unique UPI ID and NPA/write-off denial; PMAY-U 2.0 ₹9 lakh ceiling and four
manual checks; Snehapoorvam `< ₹20,000` / `< ₹22,375` and degree students;
Samaswasam 5-year window; PM-JAY citizenship; and all corrected sources, dates
and wording.
