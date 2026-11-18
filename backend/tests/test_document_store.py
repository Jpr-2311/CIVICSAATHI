"""ChromaDB persistence, filtering, deletion, deduplication and registry safety."""

import pytest
from document_helpers import FakeEmbedder

from app.database.document_store import (
    DocumentRegistry,
    DocumentStore,
    DocumentStoreError,
    VectorStore,
)
from app.models.documents import DocumentDetail
from app.services.chunker import ChunkingConfig, chunk_pages
from app.services.pdf_extractor import ExtractedPage

COLLECTION = "civicsaathi_test_docs"


def sample_chunks(text: str) -> list:
    return chunk_pages(
        [ExtractedPage(3, text)],
        config=ChunkingConfig(chunk_chars=120, overlap_chars=20, min_chunk_chars=10),
    )


def add_document(store: VectorStore, document_id: str, text: str, embedder) -> int:
    return store.add_document_chunks(
        document_id=document_id,
        original_filename=f"{document_id}.pdf",
        checksum=f"checksum-{document_id}",
        chunks=sample_chunks(text),
        embedder=embedder,
    )


def test_insert_search_and_page_metadata(tmp_path) -> None:
    embedder = FakeEmbedder()
    store = VectorStore(tmp_path / "chroma", COLLECTION)
    assert (
        add_document(
            store, "doc-a", "Farmers can apply for crop support. " * 8, embedder
        )
        > 0
    )

    results = store.search(embedder.embed_query("farmer"), 5)
    assert results
    assert results[0]["metadata"]["document_id"] == "doc-a"
    assert results[0]["metadata"]["page_number"] == 3
    assert "Farmers" in str(results[0]["text"])
    assert embedder.passage_calls
    assert embedder.query_calls


def test_search_can_be_filtered_to_one_document(tmp_path) -> None:
    embedder = FakeEmbedder()
    store = VectorStore(tmp_path / "chroma", COLLECTION)
    add_document(
        store, "doc-farmer", "Farmers may apply for crop support. " * 6, embedder
    )
    add_document(
        store, "doc-student", "Students may apply for a study grant. " * 6, embedder
    )

    results = store.search(
        embedder.embed_query("farmer"), 10, document_id="doc-student"
    )
    assert results
    assert {item["metadata"]["document_id"] for item in results} == {"doc-student"}


def test_delete_only_removes_the_requested_document(tmp_path) -> None:
    embedder = FakeEmbedder()
    store = VectorStore(tmp_path / "chroma", COLLECTION)
    add_document(store, "doc-a", "Farmers may apply for crop support. " * 6, embedder)
    add_document(store, "doc-b", "Students may apply for a study grant. " * 6, embedder)

    removed = store.delete_document("doc-a")
    assert removed > 0
    assert store.count_for_document("doc-a") == 0
    assert store.count_for_document("doc-b") > 0
    assert store.delete_document("doc-a") == 0


def test_chroma_and_registry_survive_reopening(tmp_path) -> None:
    embedder = FakeEmbedder()
    chroma_dir = tmp_path / "chroma"
    index_path = tmp_path / "store" / "index.json"

    first = VectorStore(chroma_dir, COLLECTION)
    add_document(first, "doc-a", "Farmers may apply for crop support. " * 6, embedder)
    registry = DocumentRegistry(index_path)
    registry.add(
        DocumentDetail(
            document_id="doc-a",
            original_filename="notice.pdf",
            status="indexed",
            page_count=1,
            chunk_count=1,
            size_bytes=100,
            uploaded_at="2026-11-18T00:00:00Z",  # type: ignore[arg-type]
            checksum="checksum-doc-a",
            text_characters=200,
            needs_ocr=False,
            metadata={},
        )
    )

    reopened = VectorStore(chroma_dir, COLLECTION)
    results = reopened.search(embedder.embed_query("crop"), 5)
    assert results and results[0]["metadata"]["document_id"] == "doc-a"

    reopened_registry = DocumentRegistry(index_path)
    assert reopened_registry.get("doc-a") is not None
    assert reopened_registry.find_by_checksum("checksum-doc-a") is not None
    assert reopened_registry.delete("doc-a") is not None
    assert reopened_registry.get("doc-a") is None


def test_repeated_insertion_does_not_duplicate_chunks(tmp_path) -> None:
    embedder = FakeEmbedder()
    store = VectorStore(tmp_path / "chroma", COLLECTION)
    text = "Farmers may apply for crop support. " * 6
    add_document(store, "doc-a", text, embedder)
    first_count = store._collection.count()
    add_document(store, "doc-a", text, embedder)
    assert store._collection.count() == first_count


def test_unsafe_document_id_is_rejected(tmp_path) -> None:
    store = DocumentStore(tmp_path / "store", tmp_path / "chroma", COLLECTION)
    with pytest.raises(DocumentStoreError):
        store.pdf_path("../evil")
    with pytest.raises(DocumentStoreError):
        store.pdf_path("nested/document")
