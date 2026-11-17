"""Deterministic eligibility endpoint.

Privacy notes for this route:
- the request body is evaluated in memory and never persisted;
- no body values are logged, including on validation errors;
- validation errors and the response return field locations and the *names*
  of supplied fields, never the values themselves.
"""

from fastapi import APIRouter, Request

from app.database.scheme_repository import SchemeRepository
from app.models.schemes import EligibilityRequest, EligibilityResponse
from app.services.eligibility_service import check_eligibility

router = APIRouter(tags=["Eligibility"])


@router.post(
    "/eligibility/check",
    response_model=EligibilityResponse,
    summary="Check every curated scheme with explicit rules",
    description=(
        "Evaluate all curated schemes against an in-memory profile using "
        "explicit, data-driven rules. No language model is used. Outcomes "
        "are potentially_eligible, ineligible, insufficient_information or "
        "manual_review; potentially_eligible means every encoded condition "
        "passed and is not an official eligibility decision."
    ),
)
async def check_eligibility_endpoint(
    payload: EligibilityRequest,
    request: Request,
) -> EligibilityResponse:
    repository: SchemeRepository = request.app.state.scheme_repository
    return check_eligibility(repository, payload)
