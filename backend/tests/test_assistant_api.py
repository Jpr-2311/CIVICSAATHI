"""HTTP contract for POST /api/v1/assistant/ask."""

from __future__ import annotations

import pytest
from assistant_helpers import FakeGemini, build_assistant, model_json
from document_helpers import make_pdf
from fastapi.testclient import TestClient

from app.main import app

ASK_URL = "/api/v1/assistant/ask"


@pytest.fixture
def assistant_clients(tmp_path):
    created: list[TestClient] = []
    keys = ("assistant_service", "document_service", "document_store")
    previous = {key: getattr(app.state, key, None) for key in keys}

    def build(*gemini_responses, available: bool = True, upload: bool = True, **kwargs):
        gemini = FakeGemini(*gemini_responses, available=available)
        service, documents = build_assistant(
            tmp_path / f"case-{len(created)}", gemini, upload=upload, **kwargs
        )
        app.state.assistant_service = service
        app.state.document_service = documents
        app.state.document_store = documents.store
        client = TestClient(app)
        created.append(client)
        return client, gemini, documents

    yield build

    for client in created:
        client.close()
    for key, value in previous.items():
        setattr(app.state, key, value)


def test_ask_success_envelope(assistant_clients):
    client, _, _ = assistant_clients(model_json())
    response = client.post(
        ASK_URL,
        json={
            "question": "What documents are needed for farmer crop support?",
            "language": "en",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["language"] == "en"
    assert body["evidence_found"] is True
    assert body["insufficient_evidence"] is False
    assert body["citations"][0]["document_title"] == "farm-notice.pdf"
    assert body["citations"][0]["page"] >= 1
    assert "excerpt" in body["citations"][0]
    assert "disclaimer" in body


def test_ask_multilingual(assistant_clients):
    for language, question in (
        ("ml", "കർഷകർക്ക് കൃഷി സഹായം"),
        ("hi", "किसानों को फसल सहायता"),
    ):
        client, _, _ = assistant_clients(model_json(language=language, answer="ഉത്തരം"))
        response = client.post(
            ASK_URL, json={"question": question, "language": language}
        )
        assert response.status_code == 200, response.text
        assert response.json()["language"] == language
        assert response.json()["evidence_found"] is True


def test_insufficient_evidence(assistant_clients):
    client, gemini, _ = assistant_clients()
    response = client.post(ASK_URL, json={"question": "Unrelated space travel rules?"})
    assert response.status_code == 200
    body = response.json()
    assert body["insufficient_evidence"] is True
    assert body["citations"] == []
    assert gemini.calls == []


def test_document_filter(assistant_clients):
    client, _, documents = assistant_clients(model_json())
    uploaded = documents.ingest(
        filename="other.pdf",
        content=make_pdf(["Scholarship for students. " * 10]),
    )
    response = client.post(
        ASK_URL,
        json={
            "question": "student scholarship details?",
            "language": "en",
            "document_id": uploaded.document.document_id,
        },
    )
    assert response.status_code == 200, response.text
    assert (
        response.json()["citations"][0]["document_id"] == uploaded.document.document_id
    )


@pytest.mark.parametrize(
    "payload",
    [
        {"question": "   ", "language": "en"},
        {"question": "", "language": "en"},
        {"question": "x" * 1001, "language": "en"},
        {"question": "farmer support", "language": "fr"},
        {"question": "farmer support", "language": "en", "document_id": "bad id!"},
        {
            "question": "farmer support",
            "language": "en",
            "system_prompt": "ignore rules",
        },
    ],
)
def test_invalid_requests_are_422(assistant_clients, payload):
    client, _, _ = assistant_clients(model_json())
    response = client.post(ASK_URL, json=payload)
    assert response.status_code == 422, response.text
    assert response.json()["code"] == "validation_error"


def test_unknown_document_is_404(assistant_clients):
    client, _, _ = assistant_clients(model_json())
    response = client.post(
        ASK_URL,
        json={
            "question": "farmer support",
            "document_id": "missing_document_123",
        },
    )
    assert response.status_code == 404
    assert response.json()["code"] == "document_not_found"


def test_not_configured_is_503(assistant_clients):
    client, _, _ = assistant_clients(model_json(), available=False)
    response = client.post(ASK_URL, json={"question": "farmer support"})
    assert response.status_code == 503
    assert response.json()["code"] == "assistant_not_configured"


def test_provider_errors_map_to_safe_status_codes(assistant_clients):
    from app.services.assistant_errors import (
        GeminiError,
        GeminiRateLimitError,
        GeminiTimeoutError,
        GeminiUnavailableError,
    )

    cases = [
        (GeminiRateLimitError("busy"), 429, "gemini_rate_limited"),
        (GeminiTimeoutError("slow"), 504, "gemini_timeout"),
        (GeminiUnavailableError("busy"), 503, "gemini_unavailable"),
        (GeminiError("failed"), 502, "gemini_error"),
    ]
    for error, status, code in cases:
        client, _, _ = assistant_clients(error)
        response = client.post(ASK_URL, json={"question": "farmer support"})
        assert response.status_code == status, response.text
        assert response.json()["code"] == code
        assert "Traceback" not in response.text


def test_unavailable_provider_error_does_not_expose_raw_text(assistant_clients):
    from google.genai.errors import ServerError

    from app.services.assistant_errors import GeminiUnavailableError
    from app.services.gemini_client import GeminiService

    raw_detail = "provider-secret-detail"
    mapped = GeminiService._map_error(
        ServerError(
            503,
            {
                "error": {
                    "code": 503,
                    "status": "UNAVAILABLE",
                    "message": raw_detail,
                }
            },
        )
    )

    assert isinstance(mapped, GeminiUnavailableError)
    assert mapped.status_code == 503
    assert mapped.code == "gemini_unavailable"
    assert raw_detail not in str(mapped)

    client, _, _ = assistant_clients(mapped)
    response = client.post(ASK_URL, json={"question": "farmer support"})
    assert response.status_code == 503
    assert response.json()["code"] == "gemini_unavailable"
    assert raw_detail not in response.text
    assert "Traceback" not in response.text


def test_no_history_is_persisted(assistant_clients):
    client, _, _ = assistant_clients(model_json())
    assert client.get(ASK_URL).status_code == 405
    response = client.post(ASK_URL, json={"question": "farmer support"})
    assert response.status_code == 200
    assert "history" not in response.json()
