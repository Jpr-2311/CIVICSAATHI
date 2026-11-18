"""Government document endpoints.

Uploads are read into memory with a hard byte cap and handed to the service;
the blocking PDF/embedding/ChromaDB work runs in a threadpool so the event
loop stays responsive. Responses never expose storage paths.
"""

from typing import Annotated

from fastapi import APIRouter, File, Path, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.models.documents import (
    DocumentDeleteResponse,
    DocumentDetail,
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    DocumentUploadResponse,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])

DocumentId = Annotated[
    str,
    Path(
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9_-]+$",
        description="Server-generated document identifier.",
    ),
]


def _service(request: Request) -> DocumentService:
    return request.app.state.document_service


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=201,
    summary="Upload and index a PDF",
    description=(
        "Validates real PDF content, extracts page text, stores the original "
        "file, indexes page-aware chunks and returns document metadata. "
        "Re-uploading the same file returns the existing record (HTTP 200) "
        "without creating duplicate vectors."
    ),
)
async def upload_document(request: Request, file: Annotated[UploadFile, File(...)]):
    settings = get_settings()
    # Read one byte past the limit so oversized files are rejected without
    # ever buffering the whole upload.
    content = await file.read(settings.document_max_upload_bytes + 1)
    result = await run_in_threadpool(
        _service(request).ingest, filename=file.filename, content=content
    )
    if result.duplicate:
        return JSONResponse(status_code=200, content=result.model_dump(mode="json"))
    return result


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List uploaded documents",
    description="Returns library metadata: status, filename, pages, chunks and upload time.",
)
async def list_documents(request: Request) -> DocumentListResponse:
    return await run_in_threadpool(_service(request).list_documents)


@router.post(
    "/search",
    response_model=DocumentSearchResponse,
    summary="Search indexed passages",
    description=(
        "Retrieves real text passages with document and page references using "
        "multilingual embeddings. An explicit no-evidence result is returned "
        "when nothing relevant is indexed. Similarity is not proof of accuracy."
    ),
)
async def search_documents(
    request: Request, payload: DocumentSearchRequest
) -> DocumentSearchResponse:
    return await run_in_threadpool(
        _service(request).search,
        query=payload.query,
        top_k=payload.top_k,
        document_id=payload.document_id,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentDetail,
    summary="Get document details",
)
async def get_document(request: Request, document_id: DocumentId) -> DocumentDetail:
    return await run_in_threadpool(_service(request).get_document, document_id)


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document and its passages",
    description="Removes only this document's vectors, record and stored PDF.",
)
async def delete_document(
    request: Request, document_id: DocumentId
) -> DocumentDeleteResponse:
    return await run_in_threadpool(_service(request).delete_document, document_id)
