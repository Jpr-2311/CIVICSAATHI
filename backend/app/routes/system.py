"""Public system metadata consumed by the workspace UI and API clients."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.models.schemas import SystemInfoResponse
from app.services.system_service import build_system_info

router = APIRouter(tags=["System"])


@router.get(
    "/system/info",
    response_model=SystemInfoResponse,
    summary="Product and build metadata",
)
async def system_info() -> SystemInfoResponse:
    return build_system_info(get_settings())
