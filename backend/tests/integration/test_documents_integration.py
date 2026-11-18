"""Gated real-model integration test.

Run explicitly after the model is cached:

    CIVICSAATHI_RUN_MODEL_TESTS=1 pytest tests/integration -q

It is skipped in the default unit-test run so no test depends on a download.
"""

import os

import pytest
from document_helpers import make_pdf

from app.core.config import Settings
from app.database.document_store import DocumentStore
from app.services.document_service import DocumentService
from app.services.embeddings import EmbeddingService

pytestmark = pytest.mark.skipif(
    os.getenv("CIVICSAATHI_RUN_MODEL_TESTS") != "1",
    reason="Real embedding model tests are opt-in.",
)


def test_real_multilingual_embeddings_retrieve_english_page(tmp_path) -> None:
    settings = Settings(
        document_storage_dir=tmp_path / "store",
        chroma_persist_dir=tmp_path / "chroma",
        document_collection_name="civicsaathi_integration_docs",
    )
    store = DocumentStore(
        settings.document_storage_dir,
        settings.chroma_persist_dir,
        settings.document_collection_name,
    )
    service = DocumentService(
        store, settings, embedder=EmbeddingService(settings.embedding_model_name)
    )

    uploaded = service.ingest(
        filename="kerala-farm-notice.pdf",
        content=make_pdf(
            [
                (
                    "Kerala farmers can apply for crop support and irrigation "
                    "assistance at the village office. The scheme helps cultivators "
                    "during difficult seasons."
                )
            ]
        ),
    )
    assert uploaded.document.status == "indexed"
    assert uploaded.document.chunk_count > 0

    for query in (
        "crop support for farmers",
        "കർഷകർക്ക് കൃഷി സഹായം",
        "किसानों को फसल सहायता",
    ):
        result = service.search(query, top_k=3)
        assert result.has_evidence is True, query
        assert result.results[0].page_number == 1
        assert "farmers" in result.results[0].text.casefold()
