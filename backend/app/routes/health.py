"""Health and readiness endpoints.

- /health is a liveness probe: cheap, no external dependencies.
- /health/readiness reports the state of data and AI dependencies.
"""

from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.models.schemas import HealthResponse, ReadinessResponse
from app.services.system_service import build_health, build_readiness

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness check",
    description="Confirms the API process is running. Never calls external services.",
)
async def health(request: Request) -> HealthResponse:
    return build_health(
        settings=get_settings(),
        started_at=request.app.state.started_at,
    )


@router.get(
    "/health/readiness",
    response_model=ReadinessResponse,
    summary="Dependency readiness",
    description=(
        "Reports the state of the scheme dataset, Supabase, Gemini and "
        "ChromaDB. Planned dependencies are reported honestly as pending."
    ),
)
async def readiness(request: Request) -> ReadinessResponse:
    return build_readiness(
        settings=get_settings(),
        repository=request.app.state.scheme_repository,
    )
