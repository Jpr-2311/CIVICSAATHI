"""Service-level ingestion, duplicate handling, search and deletion."""

import pytest
from document_helpers import FakeEmbedder, make_pdf

from app.core.config import Settings
from app.database.document_store import DocumentStore
from app.services.document_service import (
    DocumentNotFoundError,
    DocumentService,
)


def build_service(tmp_path, embedder=None, **overrides):
    settings = Settings(
        document_storage_dir=tmp_path / "store",
        chroma_persist_dir=tmp_path / "chroma",
        document_collection_name="civicsaathi_service_tests",
        document_chunk_chars=160,
        document_chunk_overlap_chars=30,
        document_min_chunk_chars=20,
        document_ocr_min_page_chars=80,
        **overrides,
    )
    store = DocumentStore(
        settings.document_storage_dir,
        settings.chroma_persist_dir,
        settings.document_collection_name,
    )
    return DocumentService(store, settings, embedder or FakeEmbedder())


def test_ingest_stores_document_without_exposing_paths(tmp_path) -> None:
    service = build_service(tmp_path)
    content = make_pdf(["Farmers can apply for crop support. " * 12])
    result = service.ingest(filename="notice.pdf", content=content)

    assert result.duplicate is False
    assert result.document.status == "indexed"
    assert result.document.chunk_count > 0
    assert result.document.page_count == 1
    assert result.document.checksum
    assert len(result.document.document_id) == 32
    assert str(service.store.storage_dir) not in result.model_dump_json()
    assert service.store.pdf_path(result.document.document_id).exists()


def test_duplicate_upload_returns_existing_record_without_new_vectors(tmp_path) -> None:
    service = build_service(tmp_path)
    content = make_pdf(["Farmers can apply for crop support. " * 12])
    first = service.ingest(filename="notice.pdf", content=content)
    second = service.ingest(filename="renamed.pdf", content=content)

    assert second.duplicate is True
    assert second.document.document_id == first.document.document_id
    assert service.store.vectors._collection.count() == first.document.chunk_count
    assert len(service.list_documents().documents) == 1


def test_search_retrieves_cited_passages_in_three_languages(tmp_path) -> None:
    service = build_service(tmp_path)
    service.ingest(
        filename="farm-notice.pdf",
        content=make_pdf(["Farmers can apply for crop support. " * 12]),
    )

    for query in ("farmers", "കർഷകർക്ക് കൃഷി സഹായം", "किसानों को कृषि सहायता"):
        response = service.search(query)
        assert response.has_evidence is True
        assert response.results
        assert response.results[0].page_number == 1
        assert response.results[0].original_filename == "farm-notice.pdf"
        assert "Farmers" in response.results[0].text
        assert response.results[0].similarity > 0
        assert "not proof" in response.similarity_notice


def test_search_reports_no_relevant_evidence(tmp_path) -> None:
    service = build_service(tmp_path)
    service.ingest(
        filename="farm-notice.pdf",
        content=make_pdf(["Farmers can apply for crop support. " * 12]),
    )
    response = service.search("spaceships on Mars")
    assert response.has_evidence is False
    assert response.results == []
    assert "No relevant evidence" in response.message


def test_search_filter_and_top_k_are_bounded(tmp_path) -> None:
    service = build_service(tmp_path)
    first = service.ingest(
        filename="farm.pdf",
        content=make_pdf(["Farmers can apply for crop support. " * 12]),
    )
    service.ingest(
        filename="study.pdf",
        content=make_pdf(["Students may apply for a study grant. " * 12]),
    )

    filtered = service.search("farmer", document_id=first.document.document_id)
    assert {item.document_id for item in filtered.results} == {
        first.document.document_id
    }

    limited = service.search("farmer", top_k=999)
    assert limited.top_k == service.settings.document_search_max_top_k

    with pytest.raises(DocumentNotFoundError):
        service.search("farmer", document_id="missing-id")


def test_blank_pdf_is_stored_as_needing_ocr(tmp_path) -> None:
    service = build_service(tmp_path)
    result = service.ingest(filename="scan.pdf", content=make_pdf([""]))
    assert result.document.status == "needs_ocr"
    assert result.document.chunk_count == 0
    assert service.search("farmers").has_evidence is False


def test_delete_removes_document_and_its_vectors(tmp_path) -> None:
    service = build_service(tmp_path)
    document = service.ingest(
        filename="farm.pdf",
        content=make_pdf(["Farmers can apply for crop support. " * 12]),
    )
    other = service.ingest(
        filename="study.pdf",
        content=make_pdf(["Students may apply for a study grant. " * 12]),
    )

    response = service.delete_document(document.document.document_id)
    assert response.deleted is True
    assert service.store.vectors.count_for_document(document.document.document_id) == 0
    assert service.store.vectors.count_for_document(other.document.document_id) > 0
    with pytest.raises(DocumentNotFoundError):
        service.get_document(document.document.document_id)
