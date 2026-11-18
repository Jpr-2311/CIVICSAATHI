"""HTTP contract for upload, list, detail, search, delete and validation errors."""

import pytest
from document_helpers import FakeEmbedder, make_pdf
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.database.document_store import DocumentStore
from app.main import app
from app.services.document_service import DocumentService

FARM_PDF = make_pdf(["Farmers can apply for crop support. " * 12])


@pytest.fixture
def document_clients(tmp_path):
    """Build isolated document apps; restore global app.state after each test."""
    created: list[TestClient] = []
    previous_service = getattr(app.state, "document_service", None)
    previous_store = getattr(app.state, "document_store", None)

    def build(**overrides):
        settings = Settings(
            document_storage_dir=tmp_path / f"store-{len(created)}",
            chroma_persist_dir=tmp_path / f"chroma-{len(created)}",
            document_collection_name=f"civicsaathi_api_tests_{len(created)}",
            document_chunk_chars=160,
            document_chunk_overlap_chars=30,
            document_min_chunk_chars=20,
            **overrides,
        )
        store = DocumentStore(
            settings.document_storage_dir,
            settings.chroma_persist_dir,
            settings.document_collection_name,
        )
        service = DocumentService(store, settings, embedder=FakeEmbedder())
        client = TestClient(app)
        app.state.document_service = service
        app.state.document_store = store
        created.append(client)
        return client

    yield build

    for client in created:
        client.close()
    app.state.document_service = previous_service
    app.state.document_store = previous_store


def test_upload_list_detail_search_and_delete(document_clients) -> None:
    client = document_clients()

    empty = client.get("/api/v1/documents")
    assert empty.status_code == 200
    assert empty.json() == {"documents": [], "total": 0}

    uploaded = client.post(
        "/api/v1/documents/upload",
        files={"file": ("farm-notice.pdf", FARM_PDF, "application/pdf")},
    )
    assert uploaded.status_code == 201, uploaded.text
    document = uploaded.json()["document"]
    assert uploaded.json()["duplicate"] is False
    assert document["status"] == "indexed"
    assert document["chunk_count"] > 0
    assert "storage" not in document
    assert "path" not in document

    listing = client.get("/api/v1/documents").json()
    assert listing["total"] == 1
    summary = listing["documents"][0]
    assert summary["original_filename"] == "farm-notice.pdf"
    assert {"status", "page_count", "chunk_count", "uploaded_at"} <= set(summary)
    assert "checksum" not in summary

    detail = client.get(f"/api/v1/documents/{document['document_id']}")
    assert detail.status_code == 200
    assert detail.json()["checksum"] == document["checksum"]

    search = client.post(
        "/api/v1/documents/search",
        json={"query": "കർഷകർക്ക് കൃഷി സഹായം", "top_k": 3},
    )
    assert search.status_code == 200, search.text
    body = search.json()
    assert body["has_evidence"] is True
    assert body["count"] >= 1
    assert body["results"][0]["page_number"] == 1
    assert body["results"][0]["original_filename"] == "farm-notice.pdf"
    assert body["top_k"] == 3
    assert body["similarity_notice"]

    deleted = client.delete(f"/api/v1/documents/{document['document_id']}")
    assert deleted.status_code == 200
    assert deleted.json()["chunks_deleted"] > 0
    assert client.get(f"/api/v1/documents/{document['document_id']}").status_code == 404
    assert client.get("/api/v1/documents").json()["total"] == 0


def test_duplicate_upload_returns_200_and_one_record(document_clients) -> None:
    client = document_clients()
    first = client.post(
        "/api/v1/documents/upload",
        files={"file": ("notice.pdf", FARM_PDF, "application/pdf")},
    )
    duplicate = client.post(
        "/api/v1/documents/upload",
        files={"file": ("copy.pdf", FARM_PDF, "application/pdf")},
    )
    assert first.status_code == 201
    assert duplicate.status_code == 200
    assert duplicate.json()["duplicate"] is True
    assert (
        duplicate.json()["document"]["document_id"]
        == first.json()["document"]["document_id"]
    )
    assert client.get("/api/v1/documents").json()["total"] == 1


@pytest.mark.parametrize(
    ("content", "expected_code", "expected_status"),
    [
        (b"not a pdf", "invalid_pdf", 400),
        (b"", "empty_file", 400),
        (b"%PDF-1.7\nnot a real pdf", "corrupt_pdf", 400),
    ],
)
def test_upload_validation_errors(
    document_clients, content, expected_code, expected_status
) -> None:
    client = document_clients()
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("bad.pdf", content, "application/pdf")},
    )
    assert response.status_code == expected_status
    assert response.json()["code"] == expected_code


def test_oversized_upload_is_rejected(document_clients) -> None:
    client = document_clients(document_max_upload_bytes=64)
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": ("large.pdf", FARM_PDF, "application/pdf")},
    )
    assert response.status_code == 413
    assert response.json()["code"] == "file_too_large"


def test_search_validation_and_unknown_document(document_clients) -> None:
    client = document_clients()
    blank = client.post("/api/v1/documents/search", json={"query": "   "})
    assert blank.status_code == 422
    assert blank.json()["code"] == "validation_error"

    missing = client.get("/api/v1/documents/not-a-real-id")
    assert missing.status_code == 404
    assert missing.json()["code"] == "document_not_found"

    unsafe_id = client.get("/api/v1/documents/bad.id")
    assert unsafe_id.status_code == 422

    filtered = client.post(
        "/api/v1/documents/search",
        json={"query": "farmers", "document_id": "missing-id"},
    )
    assert filtered.status_code == 404
    assert filtered.json()["code"] == "document_not_found"


def test_no_evidence_response_is_explicit(document_clients) -> None:
    client = document_clients()
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("farm.pdf", FARM_PDF, "application/pdf")},
    )
    response = client.post(
        "/api/v1/documents/search", json={"query": "spaceships on Mars"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["has_evidence"] is False
    assert body["results"] == []
    assert "No relevant evidence" in body["message"]
