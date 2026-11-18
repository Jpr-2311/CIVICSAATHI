"""Orchestration for document ingestion, retrieval and safe deletion.

Routes stay thin: this service owns validation calls, generated identifiers,
chunking, embedding, vector insertion, registry consistency and honest
no-evidence results. Heavy, blocking work is invoked from a threadpool by the
route layer.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from app.core.config import Settings
from app.database.document_store import DocumentStore, DocumentStoreError
from app.models.documents import (
    DocumentDeleteResponse,
    DocumentDetail,
    DocumentListResponse,
    DocumentSearchResponse,
    DocumentSearchResult,
    DocumentSummary,
    DocumentUploadResponse,
)
from app.services.chunker import ChunkingConfig, chunk_pages
from app.services.embeddings import EmbeddingError, EmbeddingProvider, EmbeddingService
from app.services.pdf_extractor import extract_document

logger = logging.getLogger(__name__)

SIMILARITY_NOTICE = (
    "Similarity shows how closely a passage matches the query. It is not proof "
    "that the passage is factually correct — verify it against the official source."
)


class DocumentServiceError(RuntimeError):
    status_code = 500
    code = "document_error"


class DocumentNotFoundError(DocumentServiceError):
    status_code = 404
    code = "document_not_found"


class DocumentProcessingError(DocumentServiceError):
    status_code = 500
    code = "document_processing_error"


class DocumentService:
    def __init__(
        self,
        store: DocumentStore,
        settings: Settings,
        embedder: EmbeddingProvider | None = None,
    ) -> None:
        self.store = store
        self.settings = settings
        self.embedder: EmbeddingProvider = embedder or EmbeddingService(
            settings.embedding_model_name
        )

    def _chunking_config(self) -> ChunkingConfig:
        return ChunkingConfig(
            chunk_chars=self.settings.document_chunk_chars,
            overlap_chars=self.settings.document_chunk_overlap_chars,
            min_chunk_chars=self.settings.document_min_chunk_chars,
        )

    def ingest(self, *, filename: str | None, content: bytes) -> DocumentUploadResponse:
        """Validate, store and index one PDF. Repeated files are not re-ingested."""
        extracted = extract_document(
            filename=filename,
            content=content,
            max_bytes=self.settings.document_max_upload_bytes,
            max_pages=self.settings.document_max_pages,
            ocr_min_page_chars=self.settings.document_ocr_min_page_chars,
        )

        existing = self.store.registry.find_by_checksum(extracted.checksum)
        if existing is not None:
            logger.info("Duplicate document skipped: %s", existing.document_id)
            return DocumentUploadResponse(
                document=existing,
                duplicate=True,
                message=(
                    "This PDF has already been uploaded. The existing document "
                    "was returned; no duplicate passages were created."
                ),
            )

        document_id = uuid.uuid4().hex
        path = self.store.pdf_path(document_id)
        try:
            path.write_bytes(content)
            chunks = chunk_pages(extracted.pages, config=self._chunking_config())
            chunk_count = self.store.vectors.add_document_chunks(
                document_id=document_id,
                original_filename=extracted.original_filename,
                checksum=extracted.checksum,
                chunks=chunks,
                embedder=self.embedder,
            )
            status = (
                "indexed"
                if chunk_count
                else ("needs_ocr" if extracted.needs_ocr else "empty")
            )
            record = DocumentDetail(
                document_id=document_id,
                original_filename=extracted.original_filename,
                status=status,
                page_count=extracted.page_count,
                chunk_count=chunk_count,
                size_bytes=extracted.size_bytes,
                uploaded_at=datetime.now(UTC),
                checksum=extracted.checksum,
                text_characters=extracted.total_characters,
                needs_ocr=extracted.needs_ocr,
                metadata=extracted.metadata,
            )
            self.store.registry.add(record)
        except (OSError, DocumentStoreError, EmbeddingError) as exc:
            # Roll back partial work; never leave orphaned vectors or files.
            try:
                self.store.vectors.delete_document(document_id)
            except Exception:  # pragma: no cover - best-effort rollback
                logger.exception("Could not roll back vectors for %s", document_id)
            try:
                path.unlink(missing_ok=True)
            except OSError:  # pragma: no cover - best-effort rollback
                logger.exception("Could not remove partial upload %s", document_id)
            logger.exception("Document ingestion failed")
            raise DocumentProcessingError(
                "This document could not be processed. Please try again."
            ) from exc

        return DocumentUploadResponse(
            document=record,
            duplicate=False,
            message=(
                f"Indexed {chunk_count} passages across {record.page_count} page(s)."
                if chunk_count
                else "The PDF was stored, but no searchable text could be extracted."
            ),
        )

    def list_documents(self) -> DocumentListResponse:
        fields = {
            "document_id",
            "original_filename",
            "status",
            "page_count",
            "chunk_count",
            "size_bytes",
            "uploaded_at",
        }
        documents = [
            DocumentSummary.model_validate(record.model_dump(include=fields))
            for record in self.store.registry.list()
        ]
        return DocumentListResponse(documents=documents, total=len(documents))

    def get_document(self, document_id: str) -> DocumentDetail:
        record = self.store.registry.get(document_id)
        if record is None:
            raise DocumentNotFoundError("The requested document was not found.")
        return record

    def delete_document(self, document_id: str) -> DocumentDeleteResponse:
        record = self.store.registry.get(document_id)
        if record is None:
            raise DocumentNotFoundError("The requested document was not found.")
        chunks_deleted = self.store.vectors.delete_document(document_id)
        self.store.registry.delete(document_id)
        stored = self.store.pdf_path(document_id)
        try:
            stored.unlink(missing_ok=True)
        except OSError:  # pragma: no cover - non-fatal cleanup
            logger.warning("Stored PDF could not be removed for %s", document_id)
        return DocumentDeleteResponse(
            document_id=document_id,
            chunks_deleted=chunks_deleted,
            message="The document and its indexed passages were deleted.",
        )

    def search(
        self,
        query: str,
        top_k: int | None = None,
        document_id: str | None = None,
    ) -> DocumentSearchResponse:
        """Retrieve real passages with page citations, or say no evidence exists."""
        clean_query = query.strip()
        if not clean_query:
            raise DocumentServiceError("A search query is required.")
        if document_id and self.store.registry.get(document_id) is None:
            raise DocumentNotFoundError("The requested document was not found.")

        limit = self.settings.document_search_top_k if top_k is None else top_k
        limit = max(1, min(int(limit), self.settings.document_search_max_top_k))

        vector = self.embedder.embed_query(clean_query)
        raw_results = self.store.vectors.search(vector, limit, document_id)

        results: list[DocumentSearchResult] = []
        for item in raw_results:
            distance = float(item["distance"])
            if distance > self.settings.document_search_max_distance:
                continue
            metadata = dict(item["metadata"] or {})
            filename = str(
                metadata.get("original_filename")
                or metadata.get("document_name")
                or "document.pdf"
            )
            results.append(
                DocumentSearchResult(
                    document_id=str(metadata.get("document_id", "")),
                    original_filename=filename,
                    page_number=int(metadata.get("page_number", 1)),
                    chunk_index=int(metadata.get("chunk_index", 0)),
                    text=str(item["text"]),
                    distance=round(distance, 4),
                    similarity=round(1 - distance, 4),
                    metadata=metadata,
                )
            )

        has_evidence = bool(results)
        message = (
            f"{len(results)} relevant passage(s) retrieved from your documents."
            if has_evidence
            else "No relevant evidence was found in the uploaded documents."
        )
        return DocumentSearchResponse(
            query=clean_query,
            top_k=limit,
            document_id=document_id,
            results=results,
            count=len(results),
            has_evidence=has_evidence,
            message=message,
            similarity_notice=SIMILARITY_NOTICE,
        )
