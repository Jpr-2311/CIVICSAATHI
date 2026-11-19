"""CIVICSAATHI AI FastAPI application entrypoint.

Run locally from the `backend/` directory:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.database.document_store import DocumentStore, DocumentStoreError
from app.database.scheme_repository import (
    DatasetUnavailableError,
    SchemeRepository,
)
from app.routes import assistant, documents, eligibility, health, schemes, system
from app.services.assistant_errors import AssistantServiceError
from app.services.assistant_service import AssistantService
from app.services.document_service import DocumentService, DocumentServiceError
from app.services.gemini_client import GeminiService
from app.services.pdf_extractor import PDFValidationError

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialise process-level state once, and clean up on shutdown."""
    app.state.started_at = datetime.now(UTC)
    app.state.scheme_repository = SchemeRepository(settings.scheme_dataset_path)
    try:
        app.state.document_store = DocumentStore(
            storage_dir=settings.document_storage_dir,
            chroma_dir=settings.chroma_persist_dir,
            collection_name=settings.document_collection_name,
        )
    except DocumentStoreError as exc:
        logger.critical("Persistent document storage is unavailable: %s", exc)
        raise RuntimeError(
            "Persistent document storage is unavailable. Check the configured "
            "PERSISTENT_DATA_DIR, CHROMA_PERSIST_DIR and DOCUMENT_STORAGE_DIR."
        ) from exc
    app.state.document_service = DocumentService(app.state.document_store, settings)
    # The key is optional. Use the same guard as readiness so startup stays up
    # without a key and the assistant reports assistant_not_configured instead.
    api_key = (
        settings.gemini_api_key.get_secret_value()
        if settings.gemini_configured
        else None
    )
    app.state.gemini_service = GeminiService(
        api_key=api_key,
        model=settings.gemini_model,
        timeout=settings.assistant_request_timeout_seconds,
        max_output_tokens=settings.assistant_max_output_tokens,
    )
    app.state.assistant_service = AssistantService(
        document_service=app.state.document_service,
        gemini=app.state.gemini_service,
        settings=settings,
    )
    logger.info(
        "Starting %s v%s [%s] on prefix %s",
        settings.app_name,
        settings.app_version,
        settings.environment,
        settings.api_prefix,
    )
    logger.info("Document storage: %s", settings.document_storage_dir)
    logger.info("Chroma persistence: %s", settings.chroma_persist_dir)
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
    allow_headers=["Accept", "Content-Type"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(system.router, prefix=settings.api_prefix)
app.include_router(schemes.router, prefix=settings.api_prefix)
app.include_router(eligibility.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(assistant.router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return validation errors without echoing the submitted values.

    FastAPI's default 422 body includes the rejected input. On the eligibility
    route an unknown field may contain an Aadhaar number or another identifier,
    so the response keeps the field location and message but drops the value.
    """
    errors = [
        {
            "type": error.get("type"),
            "loc": list(error.get("loc", [])),
            "msg": error.get("msg"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": errors, "code": "validation_error"},
    )


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


@app.exception_handler(PDFValidationError)
async def pdf_validation_handler(
    request: Request, exc: PDFValidationError
) -> JSONResponse:
    """Return a clear, safe reason for a rejected upload."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc), "code": exc.code},
    )


@app.exception_handler(DocumentServiceError)
async def document_service_handler(
    request: Request, exc: DocumentServiceError
) -> JSONResponse:
    """Return the documented error envelope for document operations."""
    if exc.status_code >= 500:
        logger.error("Document operation failed on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc), "code": exc.code},
    )


@app.exception_handler(AssistantServiceError)
async def assistant_service_handler(
    request: Request, exc: AssistantServiceError
) -> JSONResponse:
    """Return documented assistant errors without prompts, keys or stack traces."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc), "code": exc.code},
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
