"""CIVICSAATHI AI FastAPI application entrypoint.

Run locally from the `backend/` directory:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.database.scheme_repository import (
    DatasetUnavailableError,
    SchemeRepository,
)
from app.routes import eligibility, health, schemes, system

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialise process-level state once, and clean up on shutdown."""
    app.state.started_at = datetime.now(UTC)
    app.state.scheme_repository = SchemeRepository(settings.scheme_dataset_path)
    logger.info(
        "Starting %s v%s [%s] on prefix %s",
        settings.app_name,
        settings.app_version,
        settings.environment,
        settings.api_prefix,
    )
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=f"{settings.app_name} API",
    description=(
        "REST API for scheme discovery, deterministic eligibility checks, "
        "document intelligence and evidence-backed multilingual answers."
    ),
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(system.router, prefix=settings.api_prefix)
app.include_router(schemes.router, prefix=settings.api_prefix)
app.include_router(eligibility.router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }


@app.exception_handler(DatasetUnavailableError)
async def dataset_unavailable_handler(
    request: Request, exc: DatasetUnavailableError
) -> JSONResponse:
    """Fail honestly when the curated dataset cannot be served."""
    logger.error("Scheme dataset unavailable on %s", request.url.path)
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc),
            "code": "dataset_unavailable",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a consistent error envelope without leaking internals."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again.",
            "code": "internal_error",
        },
    )
