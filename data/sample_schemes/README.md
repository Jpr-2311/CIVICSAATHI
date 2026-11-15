# Scheme dataset policy

This directory holds the curated government scheme dataset used by the API.

## Rules

1. **Official sources only.** Every scheme record must link to a government
   portal (for example `kerala.gov.in`, `india.gov.in`, `myscheme.gov.in` or a
   department subdomain).
2. **No invented schemes or benefits.** If a field cannot be verified, leave it
   out and mark the record's verification status as `unverified`.
3. **Every record carries provenance.** Store the source URL, the date it was
   last verified and the notification or page it came from.
4. **Demo data is labelled.** Any sample record added for a demo must be marked
   `is_demo: true` and must never be presented as an official scheme.

## Day 1 state

`schemes.json` is valid and intentionally empty. The readiness endpoint reports
the dataset as `pending`, not as fabricated content. Day 2 imports curated
Kerala and central schemes with source links.

## Planned record shape

```json
{
  "id": "kerala-example-scheme",
  "name": { "en": "...", "ml": "..." },
  "category": "agriculture",
  "summary": { "en": "...", "ml": "..." },
  "benefits": ["..."],
  "eligibility_summary": ["..."],
  "required_documents": ["..."],
  "application_steps": ["..."],
  "official_url": "https://...",
  "department": "...",
  "source": {
    "url": "https://...",
    "verified_on": "2026-11-15",
    "title": "..."
  },
  "is_demo": false,
  "verification_status": "verified"
}
```
