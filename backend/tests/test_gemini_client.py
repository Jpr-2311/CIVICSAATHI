"""Unit tests for the lazy Gemini provider wrapper (no network calls)."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from google.genai import types

from app.services.assistant_errors import (
    AssistantNotConfiguredError,
    GeminiError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    GeminiUnavailableError,
)
from app.services.gemini_client import GENERATION_SCHEMA, GeminiService


def make_service(api_key: str | None = "test-key"):
    return GeminiService(
        api_key=api_key,
        model="gemini-2.5-flash",
        timeout=30.0,
        max_output_tokens=900,
    )


def test_client_is_lazy_and_availability_tracks_key():
    service = make_service()
    assert service._client is None
    assert service.available is True
    assert make_service(None).available is False
    assert make_service("").available is False


def test_not_configured_raises_without_importing_sdk():
    service = make_service(None)
    with pytest.raises(AssistantNotConfiguredError):
        service.generate(system_instruction="x", prompt="y")


def test_schema_allows_only_evidence_ids():
    serialized = str(GENERATION_SCHEMA)
    assert "evidence_id" in serialized
    for forbidden in ("document_title", "page_number", "url", "excerpt"):
        assert forbidden not in serialized


class CodedError(Exception):
    """Stand-in for an SDK error carrying an HTTP status code."""

    def __init__(self, code: int) -> None:
        self.code = code
        super().__init__(f"status {code}")


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (TimeoutError(), GeminiTimeoutError),
        (CodedError(429), GeminiRateLimitError),
        (CodedError(503), GeminiUnavailableError),
        (ValueError("bad request"), GeminiError),
    ],
)
def test_generate_maps_provider_errors(error, expected):
    service = make_service()

    class FailingModels:
        def generate_content(self, **kwargs):
            raise error

    service._client = SimpleNamespace(models=FailingModels())
    with pytest.raises(expected):
        service.generate(system_instruction="x", prompt="y")


def test_generate_returns_text_and_bounds_output():
    service = make_service()
    captured: dict[str, object] = {}

    class WorkingModels:
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(text='{"answer": "ok"}')

    service._client = SimpleNamespace(models=WorkingModels())
    assert service.generate(system_instruction="rules", prompt="question") == (
        '{"answer": "ok"}'
    )
    config = captured["config"]
    assert config.system_instruction == "rules"
    assert config.max_output_tokens == 900
    assert config.response_mime_type == "application/json"
    assert isinstance(config.response_schema, types.Schema)
    assert (
        config.response_schema.model_dump(mode="json", by_alias=True, exclude_none=True)
        == GENERATION_SCHEMA
    )
    assert captured["model"] == "gemini-2.5-flash"


def test_generate_rejects_empty_response():
    service = make_service()
    service._client = SimpleNamespace(
        models=SimpleNamespace(
            generate_content=lambda **kwargs: SimpleNamespace(text="  ")
        )
    )
    with pytest.raises(GeminiError):
        service.generate(system_instruction="x", prompt="y")
