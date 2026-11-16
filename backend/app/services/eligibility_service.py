"""Eligibility evaluation service.

The request is evaluated in memory and never persisted. The response
returns condition statuses and account-level profile field names, never
the submitted values, so a browser retry or a shared screen cannot leak
sensitive answers from this API's own payload.
"""

from __future__ import annotations

from datetime import UTC, datetime

from app.database.scheme_repository import SchemeRepository
from app.models.schemes import (
    EligibilityOutcome,
    EligibilityRequest,
    EligibilityResponse,
)
from app.services.eligibility_engine import (
    ELIGIBILITY_DISCLAIMER,
    evaluate_scheme,
    profile_values,
)

_OUTCOME_ORDER: dict[EligibilityOutcome, int] = {
    "potentially_eligible": 0,
    "manual_review": 1,
    "insufficient_information": 2,
    "ineligible": 3,
}


def check_eligibility(
    repository: SchemeRepository,
    request: EligibilityRequest,
) -> EligibilityResponse:
    """Evaluate every curated scheme against the supplied profile."""
    dataset = repository.get_dataset()
    profile = profile_values(request)

    results = [
        evaluate_scheme(scheme, dataset, profile, request.language)
        for scheme in dataset.schemes
    ]
    results.sort(
        key=lambda result: (
            _OUTCOME_ORDER[result.outcome],
            result.scheme_name.casefold(),
        )
    )

    return EligibilityResponse(
        language=request.language,
        checked_at=datetime.now(UTC),
        profile_fields_received=[
            name for name, value in profile.items() if value is not None
        ],
        results=results,
        disclaimer=ELIGIBILITY_DISCLAIMER[request.language],
    )
