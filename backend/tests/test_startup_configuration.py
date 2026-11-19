"""Startup regression tests for optional Gemini configuration.

These tests exercise the real FastAPI lifespan. They verify that a missing key
does not prevent startup, that readiness reports the missing credential, and
that a configured key keeps the existing assistant contract. Dummy values are
used; no real provider request is made and no key is logged.
"""

from __future__ import annotations

import logging
from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app import main
from app.core.config import Settings
from app.main import app
from app.routes import health

ASK_URL = "/api/v1/assistant/ask"
DUMMY_KEY = "startup-regression-dummy-key"
STATE_KEYS = (
    "started_at",
    "scheme_repository",
    "document_store",
    "document_service",
    "gemini_service",
    "assistant_service",
)


@pytest.fixture
def startup_settings(monkeypatch, tmp_path) -> Callable[[SecretStr | None], Settings]:
    """Run the real lifespan against isolated, explicit settings."""
    previous = {key: getattr(app.state, key, None) for key in STATE_KEYS}

    def build(api_key: SecretStr | None) -> Settings:
        settings = Settings(
            gemini_api_key=api_key,
            document_storage_dir=tmp_path / "documents",
            chroma_persist_dir=tmp_path / "chroma",
        )
        monkeypatch.setattr(main, "settings", settings)
        monkeypatch.setattr(health, "get_settings", lambda: settings)
        return settings

    yield build

    for key, value in previous.items():
        setattr(app.state, key, value)


def _gemini_check(client: TestClient) -> dict:
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200, response.text
    checks = response.json()["checks"]
    return next(check for check in checks if check["id"] == "gemini")


def test_startup_without_gemini_key_is_safe(startup_settings, caplog) -> None:
    startup_settings(None)

    with caplog.at_level(logging.INFO), TestClient(app) as client:
        assert client.get("/api/v1/health").status_code == 200

        gemini = _gemini_check(client)
        assert gemini["status"] == "not_configured"
        assert "GEMINI_API_KEY" in gemini["detail"]

        assert app.state.gemini_service.available is False
        assistant = client.post(ASK_URL, json={"question": "farmer support"})
        assert assistant.status_code == 503
        assert assistant.json()["code"] == "assistant_not_configured"

        # Other services remain operational without the AI credential.
        assert (
            client.get(
                "/api/v1/schemes", params={"page": 1, "page_size": 1}
            ).status_code
            == 200
        )
        assert (
            client.post(
                "/api/v1/eligibility/check", json={"language": "en", "age": 34}
            ).status_code
            == 200
        )
        assert client.get("/api/v1/documents").status_code == 200

    assert "Traceback" not in caplog.text


def test_startup_with_configured_gemini_key_keeps_contract(
    startup_settings, caplog
) -> None:
    startup_settings(SecretStr(DUMMY_KEY))

    with caplog.at_level(logging.INFO), TestClient(app) as client:
        assert app.state.gemini_service.available is True

        readiness = client.get("/api/v1/health/readiness")
        gemini = _gemini_check(client)
        assert gemini["status"] == "ok"

        # No document is uploaded in this isolated store, so the honest
        # insufficient-evidence path runs before any provider request.
        assistant = client.post(ASK_URL, json={"question": "farmer support"})
        assert assistant.status_code == 200, assistant.text
        body = assistant.json()
        assert body["insufficient_evidence"] is True
        assert body["citations"] == []

    assert DUMMY_KEY not in caplog.text
    assert DUMMY_KEY not in readiness.text
    assert DUMMY_KEY not in assistant.text
