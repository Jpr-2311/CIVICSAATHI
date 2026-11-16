"""Scheme discovery endpoints.

The catalogue is curated, validated at load time and served in the three
interface languages. Invalid ids return a clean 404; an empty result is a
normal 200 with an honest message rather than an error.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request

from app.database.scheme_repository import SchemeRepository
from app.models.schemes import (
    GovernmentLevel,
    LanguageCode,
    SchemeCategory,
    SchemeDetail,
    SchemeListResponse,
)
from app.services.scheme_service import build_scheme_detail, build_scheme_list

router = APIRouter(tags=["Schemes"])

LanguageQuery = Annotated[
    LanguageCode,
    Query(description="Interface language for the response content."),
]


def _repository(request: Request) -> SchemeRepository:
    return request.app.state.scheme_repository


@router.get(
    "/schemes",
    response_model=SchemeListResponse,
    summary="Search and filter curated schemes",
    description=(
        "Search by name, keyword, department or summary, and filter by "
        "category and government level. Results are paginated. An empty "
        "result is returned as a normal response with an explanatory "
        "message, never as a fabricated record."
    ),
)
async def list_schemes(
    request: Request,
    language: LanguageQuery = "en",
    q: Annotated[
        str | None,
        Query(
            max_length=100,
            description="Name/keyword search across the localised catalogue.",
        ),
    ] = None,
    category: Annotated[
        SchemeCategory | None,
        Query(description="Filter by scheme category."),
    ] = None,
    government_level: Annotated[
        GovernmentLevel | None,
        Query(description="Filter by central or state government level."),
    ] = None,
    page: Annotated[int, Query(ge=1, description="One-based result page.")] = 1,
    page_size: Annotated[
        int,
        Query(
            ge=1,
            le=50,
            description="Records per page (maximum 50).",
        ),
    ] = 12,
) -> SchemeListResponse:
    return build_scheme_list(
        _repository(request),
        language=language,
        query=q,
        category=category,
        government_level=government_level,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/schemes/{scheme_id}",
    response_model=SchemeDetail,
    summary="Read one curated scheme",
    description=(
        "Return the full verified record, including benefits, documents, "
        "application steps, encoded conditions and every official source."
    ),
    responses={404: {"description": "No scheme with that id exists."}},
)
async def get_scheme(
    request: Request,
    scheme_id: str,
    language: LanguageQuery = "en",
) -> SchemeDetail:
    detail = build_scheme_detail(
        _repository(request),
        scheme_id=scheme_id,
        language=language,
    )
    if detail is None:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return detail
