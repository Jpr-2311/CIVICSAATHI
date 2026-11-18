"""Shared fakes for Day 4 assistant tests (no network, no real Gemini)."""

from __future__ import annotations

import json
from typing import Any

from document_helpers import FakeEmbedder, make_pdf

from app.core.config import Settings
from app.database.document_store import DocumentStore
from app.services.assistant_service import AssistantService
from app.services.document_service import DocumentService

FARM_PDF = make_pdf(
    [
        (
            "Kerala farmers can apply for crop support at the village office. "
            "Applicants must submit an income certificate and identity proof. "
            "The last date is 30 September 2026. " * 3
        )
    ],
    metadata={"title": "Kerala Farm Support Notice"},
)


def model_json(
    *,
    answer: str = "Submit an income certificate and identity proof.",
    language: str = "en",
    evidence_found: bool = True,
    insufficient_evidence: bool = False,
    citations: list[dict[str, str]] | None = None,
) -> str:
    """Build the strict JSON payload a compliant Gemini model would return."""
    if citations is None:
        citations = [{"evidence_id": "e1"}]
    return json.dumps(
        {
            "answer": answer,
            "language": language,
            "evidence_found": evidence_found,
            "insufficient_evidence": insufficient_evidence,
            "citations": citations,
        }
    )


class FakeGemini:
    """Records prompts and returns queued payloads or raises queued errors."""

    def __init__(self, *responses: str | Exception, available: bool = True) -> None:
        self._available = available
        self.responses: list[str | Exception] = list(responses)
        self.calls: list[dict[str, Any]] = []

    @property
    def available(self) -> bool:
        return self._available

    def generate(self, *, system_instruction: str, prompt: str) -> str:
        self.calls.append({"system_instruction": system_instruction, "prompt": prompt})
        if not self.responses:
            return model_json()
        item = self.responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def build_assistant(
    tmp_path: object,
    gemini: FakeGemini,
    *,
    upload: bool = True,
    settings_overrides: dict[str, Any] | None = None,
) -> tuple[AssistantService, DocumentService]:
    """Create isolated Day 3 storage plus a Day 4 service with a fake model."""
    overrides: dict[str, Any] = {
        "document_storage_dir": tmp_path / "store",  # type: ignore[operator]
        "chroma_persist_dir": tmp_path / "chroma",  # type: ignore[operator]
        "document_collection_name": "civicsaathi_assistant_tests",
        "document_chunk_chars": 220,
        "document_chunk_overlap_chars": 40,
        "document_min_chunk_chars": 20,
    }
    if settings_overrides:
        overrides.update(settings_overrides)
    settings = Settings(**overrides)
    store = DocumentStore(
        settings.document_storage_dir,
        settings.chroma_persist_dir,
        settings.document_collection_name,
    )
    documents = DocumentService(store, settings, embedder=FakeEmbedder())
    if upload:
        documents.ingest(filename="farm-notice.pdf", content=FARM_PDF)
    service = AssistantService(documents, gemini, settings)
    return service, documents
