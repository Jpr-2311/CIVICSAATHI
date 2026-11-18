"""Day 5 end-to-end API contracts using the existing backend behaviour.

These tests connect the shipped scheme, eligibility, document and assistant
routes without changing any of them. Gemini is always faked here; the opt-in
live check lives in ``tests/integration/test_gemini_integration.py``.
"""

from __future__ import annotations

import pytest
from assistant_helpers import FARM_PDF, FakeGemini, build_assistant, model_json
from document_helpers import make_pdf

from app.main import app

SCHEME_URL = "/api/v1/schemes"
ELIGIBILITY_URL = "/api/v1/eligibility/check"
DOCUMENTS_URL = "/api/v1/documents"
SEARCH_URL = "/api/v1/documents/search"
ASK_URL = "/api/v1/assistant/ask"


@pytest.fixture
def day5_client(tmp_path, client):
    """Use the shared app client with isolated document and assistant state."""
    keys = ("assistant_service", "document_service", "document_store")
    previous = {key: getattr(app.state, key, None) for key in keys}

    gemini = FakeGemini(model_json(), model_json(), model_json())
    assistant, documents = build_assistant(tmp_path, gemini)
    app.state.assistant_service = assistant
    app.state.document_service = documents
    app.state.document_store = documents.store

    yield client, gemini, documents

    for key, value in previous.items():
        setattr(app.state, key, value)


def test_scheme_detail_context_reaches_eligibility_without_a_new_field(
    day5_client,
) -> None:
    client, _, _ = day5_client

    detail = client.get(f"{SCHEME_URL}/pm-kisan", params={"language": "en"})
    assert detail.status_code == 200, detail.text
    scheme_id = detail.json()["id"]

    response = client.post(
        ELIGIBILITY_URL,
        json={"language": "en", "age": 34, "scheme_id": scheme_id},
    )
    assert response.status_code == 422, response.text
    assert response.json()["code"] == "validation_error"
    assert scheme_id not in response.text

    accepted = client.post(
        ELIGIBILITY_URL,
        json={"language": "en", "age": 34},
    )
    assert accepted.status_code == 200, accepted.text
    body = accepted.json()
    assert body["profile_fields_received"] == ["age"]
    assert any(result["scheme_id"] == scheme_id for result in body["results"])


def test_document_library_indexing_filtering_and_citation_recovery(day5_client):
    client, gemini, _ = day5_client

    listed = client.get(DOCUMENTS_URL)
    assert listed.status_code == 200, listed.text
    assert listed.json()["total"] == 1
    farm = listed.json()["documents"][0]
    assert farm["original_filename"] == "farm-notice.pdf"
    assert farm["status"] == "indexed"

    student_upload = client.post(
        f"{DOCUMENTS_URL}/upload",
        files={
            "file": (
                "student-notice.pdf",
                make_pdf(["Students can apply for a scholarship. " * 10]),
                "application/pdf",
            )
        },
    )
    assert student_upload.status_code == 201, student_upload.text
    student = student_upload.json()["document"]
    assert student["status"] == "indexed"
    assert "path" not in student and "storage" not in student

    scanned = client.post(
        f"{DOCUMENTS_URL}/upload",
        files={"file": ("scanned-notice.pdf", make_pdf([""]), "application/pdf")},
    )
    assert scanned.status_code == 201, scanned.text
    scanned_document = scanned.json()["document"]
    assert scanned_document["status"] == "needs_ocr"
    assert scanned_document["chunk_count"] == 0

    farm_search = client.post(
        SEARCH_URL,
        json={"query": " farmers crop support ", "document_id": farm["document_id"]},
    )
    assert farm_search.status_code == 200, farm_search.text
    assert farm_search.json()["has_evidence"] is True
    assert {result["document_id"] for result in farm_search.json()["results"]} == {
        farm["document_id"]
    }

    student_search = client.post(
        SEARCH_URL,
        json={"query": "student scholarship", "document_id": student["document_id"]},
    )
    assert student_search.status_code == 200, student_search.text
    assert {result["document_id"] for result in student_search.json()["results"]} == {
        student["document_id"]
    }

    answer = client.post(
        ASK_URL,
        json={
            "question": "What documents must a farmer submit?",
            "language": "en",
            "document_id": farm["document_id"],
        },
    )
    assert answer.status_code == 200, answer.text
    body = answer.json()
    assert body["evidence_found"] is True
    assert body["citations"]
    assert all(
        citation["document_id"] == farm["document_id"] for citation in body["citations"]
    )
    assert all(
        citation["document_title"] == "farm-notice.pdf"
        for citation in body["citations"]
    )
    assert all(citation["page"] >= 1 for citation in body["citations"])
    assert all(citation["excerpt"].strip() for citation in body["citations"])
    assert all(
        citation["evidence_id"] in {f"e{index}" for index in range(1, 6)}
        for citation in body["citations"]
    )
    assert all("url" not in citation for citation in body["citations"])
    assert gemini.calls

    # A selected document can disappear between retrieval and the next question.
    deleted = client.delete(f"{DOCUMENTS_URL}/{farm['document_id']}")
    assert deleted.status_code == 200, deleted.text
    stale = client.post(
        ASK_URL,
        json={
            "question": "What documents must a farmer submit?",
            "language": "en",
            "document_id": farm["document_id"],
        },
    )
    assert stale.status_code == 404
    assert stale.json()["code"] == "document_not_found"
    assert "document_id" not in stale.json().get("detail", "")


def test_assistant_never_publishes_a_fabricated_citation_metadata(day5_client):
    client, _, _ = day5_client
    app.state.assistant_service.gemini.responses = [
        model_json(citations=[{"evidence_id": "e99"}]),
        model_json(citations=[{"evidence_id": "e1", "url": "https://fake.invalid"}]),
    ]

    first = client.post(
        ASK_URL,
        json={"question": "What documents must a farmer submit?", "language": "en"},
    )
    assert first.status_code == 200, first.text
    assert first.json()["insufficient_evidence"] is True
    assert first.json()["citations"] == []

    second = client.post(
        ASK_URL,
        json={"question": "What documents must a farmer submit?", "language": "en"},
    )
    assert second.status_code == 200, second.text
    citations = second.json()["citations"]
    assert citations
    assert all("url" not in citation for citation in citations)
    assert all(
        citation["document_title"] == "farm-notice.pdf" for citation in citations
    )


def test_live_farm_notice_fixture_is_the_only_pdf_payload(day5_client):
    """Pin the shared fixture contract used by mocked and live checks."""
    client, _, _ = day5_client
    assert FARM_PDF.startswith(b"%PDF")
    assert client.get(DOCUMENTS_URL).json()["documents"][0]["original_filename"] == (
        "farm-notice.pdf"
    )
