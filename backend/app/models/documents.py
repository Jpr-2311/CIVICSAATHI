"""Pydantic contracts for the Day 3 document intelligence API.

These models are the public contract: they never include local filesystem
paths, generated storage filenames or server internals.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DocumentStatus = Literal["indexed", "needs_ocr", "empty"]


class DocumentSummary(BaseModel):
    """The fields shown in the document library."""

    document_id: str
    original_filename: str
    status: DocumentStatus
    page_count: int = Field(ge=0)
    chunk_count: int = Field(ge=0)
    size_bytes: int = Field(ge=0)
    uploaded_at: datetime


class DocumentDetail(DocumentSummary):
    """One stored document, also used as the on-disk registry record."""

    checksum: str
    text_characters: int = Field(ge=0)
    needs_ocr: bool
    metadata: dict[str, str] = Field(default_factory=dict)


class DocumentUploadResponse(BaseModel):
    document: DocumentDetail
    duplicate: bool = False
    message: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentSummary]
    total: int = Field(ge=0)


class DocumentDeleteResponse(BaseModel):
    document_id: str
    deleted: bool = True
    chunks_deleted: int = Field(ge=0)
    message: str


class DocumentSearchRequest(BaseModel):
    """A retrieval query. `top_k` is clamped by the service to a safe limit."""

    query: str = Field(min_length=1, max_length=1000)
    top_k: int | None = Field(default=None, ge=1, le=100)
    document_id: str | None = Field(default=None, max_length=128)

    @field_validator("query")
    @classmethod
    def _query_must_have_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Query must contain text.")
        return stripped

    @field_validator("document_id")
    @classmethod
    def _strip_document_id(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class DocumentSearchResult(BaseModel):
    """An actual extracted passage with its original page reference."""

    document_id: str
    original_filename: str
    page_number: int = Field(ge=1)
    chunk_index: int = Field(ge=0)
    text: str
    distance: float
    similarity: float
    metadata: dict[str, str | int | float] = Field(default_factory=dict)


class DocumentSearchResponse(BaseModel):
    query: str
    top_k: int
    document_id: str | None = None
    results: list[DocumentSearchResult]
    count: int = Field(ge=0)
    has_evidence: bool
    message: str
    similarity_notice: str
