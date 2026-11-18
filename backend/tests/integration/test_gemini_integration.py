"""Opt-in LIVE Gemini integration test. Never runs in the default suite.

Run only when you deliberately want to spend real API calls:

    CIVICSAATHI_RUN_GEMINI_TESTS=1 pytest tests/integration/test_gemini_integration.py -q

Requires GEMINI_API_KEY in the environment (or backend/.env). No key or prompt
is printed. The default mocked suite does not need this file.
"""

from __future__ import annotations

import os

import pytest
from assistant_helpers import FARM_PDF
from document_helpers import FakeEmbedder

from app.core.config import get_settings
from app.database.document_store import DocumentStore
from app.models.assistant import AssistantAskRequest
from app.services.assistant_service import AssistantService
from app.services.document_service import DocumentService
from app.services.gemini_client import GeminiService

pytestmark = pytest.mark.skipif(
    os.getenv("CIVICSAATHI_RUN_GEMINI_TESTS") != "1",
    reason="Live Gemini tests are opt-in and require a real API key.",
)


def test_live_gemini_grounded_answer_with_valid_citation(tmp_path):
    settings = get_settings()
    if not settings.gemini_configured:
        pytest.skip("GEMINI_API_KEY is not configured.")

    store = DocumentStore(
        tmp_path / "store",
        tmp_path / "chroma",
        "civicsaathi_gemini_live_test",
    )
    documents = DocumentService(store, settings, embedder=FakeEmbedder())
    documents.ingest(filename="live-farm-notice.pdf", content=FARM_PDF)

    gemini = GeminiService(
        api_key=settings.gemini_api_key.get_secret_value(),
        model=settings.gemini_model,
        timeout=settings.assistant_request_timeout_seconds,
        max_output_tokens=settings.assistant_max_output_tokens,
    )
    service = AssistantService(documents, gemini, settings)
    response = service.ask(
        AssistantAskRequest(
            question="What documents must a farmer submit?", language="en"
        )
    )

    assert response.citations
    valid_ids = {"e1", "e2", "e3", "e4", "e5"}
    assert all(citation.evidence_id in valid_ids for citation in response.citations)
    assert all(
        citation.document_title == "live-farm-notice.pdf"
        for citation in response.citations
    )
    assert response.insufficient_evidence is False


def test_live_gemini_filtered_multilingual_answer_with_valid_citation(tmp_path):
    settings = get_settings()
    if not settings.gemini_configured:
        pytest.skip("GEMINI_API_KEY is not configured.")

    store = DocumentStore(
        tmp_path / "store-ml",
        tmp_path / "chroma-ml",
        "civicsaathi_gemini_live_test_ml",
    )
    documents = DocumentService(store, settings, embedder=FakeEmbedder())
    uploaded = documents.ingest(filename="live-farm-notice-ml.pdf", content=FARM_PDF)

    gemini = GeminiService(
        api_key=settings.gemini_api_key.get_secret_value(),
        model=settings.gemini_model,
        timeout=settings.assistant_request_timeout_seconds,
        max_output_tokens=settings.assistant_max_output_tokens,
    )
    service = AssistantService(documents, gemini, settings)
    response = service.ask(
        AssistantAskRequest(
            question="കർഷകൻ ഏത് രേഖകൾ സമർപ്പിക്കണം?",
            language="ml",
            document_id=uploaded.document.document_id,
        )
    )

    assert response.language == "ml"
    assert response.insufficient_evidence is False
    assert response.citations
    assert all(
        citation.document_id == uploaded.document.document_id
        for citation in response.citations
    )
    assert all(
        citation.document_title == "live-farm-notice-ml.pdf"
        for citation in response.citations
    )
    assert all(citation.page >= 1 for citation in response.citations)
