"""Unit tests for the lazy Gemini provider wrapper (no network calls)."""

from __future__ import annotations

import logging
import threading
import time as real_time
from datetime import UTC, datetime, timedelta
from email.utils import format_datetime
from types import SimpleNamespace

import pytest
from google.genai import types
from google.genai.errors import ClientError
from pydantic import ValidationError

from app.core.config import Settings
from app.services import gemini_client
from app.services.assistant_errors import (
    AssistantNotConfiguredError,
    GeminiError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    GeminiUnavailableError,
)
from app.services.gemini_client import GENERATION_SCHEMA, GeminiService


def _all_keys(value: object) -> set[str]:
    """Collect every key at every nesting level of a schema mapping."""
    if isinstance(value, dict):
        keys: set[str] = set()
        for key, nested in value.items():
            keys.add(str(key))
            keys.update(_all_keys(nested))
        return keys
    if isinstance(value, (list, tuple)):
        keys = set()
        for nested in value:
            keys.update(_all_keys(nested))
        return keys
    return set()


class _FakeClock:
    """Deterministic monotonic clock advanced explicitly by backoff sleeps."""

    def __init__(self, start: float = 1000.0) -> None:
        self.now = start

    def monotonic(self) -> float:
        return self.now

    def advance(self, seconds: float) -> None:
        self.now += seconds


@pytest.fixture(autouse=True)
def timing(monkeypatch):
    """Patched clock/sleep so retries are deterministic and never really wait."""
    clock = _FakeClock()
    delays: list[float] = []
    monkeypatch.setattr(gemini_client, "monotonic", clock.monotonic)

    def fake_sleep(seconds: float) -> None:
        delays.append(seconds)
        clock.advance(seconds)

    monkeypatch.setattr(gemini_client, "sleep", fake_sleep)
    return clock, delays


def make_service(api_key: str | None = "test-key"):
    return GeminiService(
        api_key=api_key,
        model="gemini-2.5-flash",
        timeout=30.0,
        max_output_tokens=900,
    )


class _SequencedModels:
    """Raise/return the given outcomes in order, then return valid JSON."""

    def __init__(self, *outcomes: object) -> None:
        self.outcomes = list(outcomes)
        self.calls = 0

    def generate_content(self, **kwargs):
        self.calls += 1
        outcome = self.outcomes.pop(0) if self.outcomes else '{"answer": "ok"}'
        if callable(outcome):
            return outcome()
        if isinstance(outcome, Exception):
            raise outcome
        return SimpleNamespace(text=outcome)


def provider_error(code: int, status: str) -> ClientError:
    return ClientError(
        code,
        {"error": {"code": code, "status": status, "message": "provider failure"}},
    )


def retry_after_error(value: str) -> ClientError:
    error = provider_error(429, "RESOURCE_EXHAUSTED")
    error.response = SimpleNamespace(headers={"Retry-After": value})
    return error


def service_with(models: _SequencedModels, **overrides) -> GeminiService:
    service = make_service()
    service._client = SimpleNamespace(models=models)
    for key, value in overrides.items():
        setattr(service, key, value)
    return service


def ask(service: GeminiService) -> str:
    return service.generate(system_instruction="rules", prompt="question")


def slow_error(clock: _FakeClock, seconds: float, error: Exception):
    """Simulate an HTTP call that consumes ``seconds`` then fails."""

    def outcome():
        clock.advance(seconds)
        raise error

    return outcome


# --- Client basics and schema ---------------------------------------------


def test_client_is_lazy_and_availability_tracks_key():
    service = make_service()
    assert service._client is None
    assert service.available is True
    assert make_service(None).available is False
    assert make_service("").available is False


def test_http_options_timeout_is_seconds_converted_to_milliseconds(monkeypatch):
    """A 30-second setting must reach HttpOptions as 30000 milliseconds."""
    from google import genai

    captured: dict[str, object] = {}

    def fake_client(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(genai, "Client", fake_client)
    service = make_service()
    service._client_or_raise()

    http_options = captured["http_options"]
    assert isinstance(http_options, types.HttpOptions)
    assert http_options.timeout == 30000
    assert service.timeout == 30.0


def test_not_configured_raises_without_importing_sdk():
    service = make_service(None)
    with pytest.raises(AssistantNotConfiguredError):
        service.generate(system_instruction="x", prompt="y")


def test_schema_allows_only_evidence_ids():
    serialized = str(GENERATION_SCHEMA)
    assert "evidence_id" in serialized
    for forbidden in ("document_title", "page_number", "url", "excerpt"):
        assert forbidden not in serialized


def test_serialized_schema_has_no_unsupported_additional_properties():
    """The API rejects this field at the root and in array item schemas."""
    forbidden = {"additionalProperties", "additional_properties"}
    assert not (_all_keys(GENERATION_SCHEMA) & forbidden)
    wire_schema = types.Schema(**GENERATION_SCHEMA).to_json_dict()
    assert not (_all_keys(wire_schema) & forbidden)


def test_schema_preserves_output_constraints():
    """Removing the unsupported field must not weaken the response contract."""
    schema = types.Schema(**GENERATION_SCHEMA).to_json_dict()
    assert schema["type"] == "OBJECT"
    assert set(schema["required"]) == {
        "answer",
        "language",
        "evidence_found",
        "insufficient_evidence",
        "citations",
    }
    props = schema["properties"]
    assert props["answer"] == {"type": "STRING"}
    assert props["language"]["type"] == "STRING"
    assert props["language"]["enum"] == ["en", "ml", "hi"]
    assert props["evidence_found"] == {"type": "BOOLEAN"}
    assert props["insufficient_evidence"] == {"type": "BOOLEAN"}
    citations = props["citations"]
    assert citations["type"] == "ARRAY"
    assert citations["items"]["type"] == "OBJECT"
    assert citations["items"]["properties"] == {"evidence_id": {"type": "STRING"}}
    assert citations["items"]["required"] == ["evidence_id"]


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


# --- Safe diagnostics ------------------------------------------------------


def test_provider_error_logs_only_structured_information(caplog):
    error = ClientError(
        400,
        {
            "error": {
                "code": 400,
                "status": "INVALID_ARGUMENT",
                "message": "Invalid JSON payload: unsupported schema field",
            }
        },
    )
    with caplog.at_level(logging.WARNING, logger="app.services.gemini_client"):
        mapped = GeminiService._map_error(error)

    assert type(mapped) is GeminiError
    text = caplog.text
    assert "Gemini request failed (ClientError)" in text
    assert "code=400" in text
    assert "status=INVALID_ARGUMENT" in text
    assert "category=invalid_request" in text
    assert "unsupported schema field" not in text
    assert "details" not in text.lower()


def test_diagnostics_never_log_secret_or_prompt(caplog):
    """A provider message containing a secret and prompt must not reach logs."""
    secret = "AQ-fake-secret-DO-NOT-LOG"
    prompt = "retrieved document paragraph about subsidies"
    error = ClientError(
        503,
        {
            "error": {
                "code": 503,
                "status": "UNAVAILABLE",
                "message": f"body leaked: {secret} / {prompt}",
            }
        },
    )
    with caplog.at_level(logging.WARNING, logger="app.services.gemini_client"):
        GeminiService._map_error(error)

    text = caplog.text
    assert secret not in text
    assert prompt not in text
    assert "code=503" in text
    assert "status=UNAVAILABLE" in text
    assert "category=unavailable" in text


def test_retry_warning_never_logs_secret_or_prompt(caplog):
    secret = "AQ-retry-secret-DO-NOT-LOG"
    prompt = "confidential retrieved passage"
    error = ClientError(
        429,
        {
            "error": {
                "code": 429,
                "status": "RESOURCE_EXHAUSTED",
                "message": f"{secret} {prompt}",
            }
        },
    )
    service = service_with(_SequencedModels(error))
    with caplog.at_level(logging.WARNING, logger="app.services.gemini_client"):
        assert ask(service) == '{"answer": "ok"}'

    text = caplog.text
    assert "Gemini transient error" in text
    assert secret not in text
    assert prompt not in text


def test_unknown_status_and_message_are_not_logged(caplog):
    class NoisyError(Exception):
        code = 418
        status = "SOMETHING_UNLISTED"
        message = "line one\nline two " + "x" * 900

    with caplog.at_level(logging.WARNING, logger="app.services.gemini_client"):
        GeminiService._map_error(NoisyError())

    text = caplog.text
    assert "code=418" in text  # valid HTTP code is safe to log
    assert "SOMETHING_UNLISTED" not in text
    assert "line one" not in text
    assert "x" * 900 not in text
    assert "category=other" in text


# --- Retry behaviour -------------------------------------------------------


def test_retries_503_then_succeeds():
    models = _SequencedModels(provider_error(503, "UNAVAILABLE"))
    assert ask(service_with(models)) == '{"answer": "ok"}'
    assert models.calls == 2


def test_retries_504_then_succeeds():
    models = _SequencedModels(provider_error(504, "DEADLINE_EXCEEDED"))
    assert ask(service_with(models)) == '{"answer": "ok"}'
    assert models.calls == 2


def test_retries_429_then_succeeds():
    models = _SequencedModels(provider_error(429, "RESOURCE_EXHAUSTED"))
    assert ask(service_with(models)) == '{"answer": "ok"}'
    assert models.calls == 2


def test_all_503_attempts_fail():
    models = _SequencedModels(*[provider_error(503, "UNAVAILABLE") for _ in range(3)])
    with pytest.raises(GeminiUnavailableError):
        ask(service_with(models))
    assert models.calls == 3


def test_all_504_attempts_fail():
    models = _SequencedModels(
        *[provider_error(504, "DEADLINE_EXCEEDED") for _ in range(3)]
    )
    with pytest.raises(GeminiTimeoutError):
        ask(service_with(models))
    assert models.calls == 3


@pytest.mark.parametrize(
    ("code", "status"),
    [
        (400, "INVALID_ARGUMENT"),
        (401, "UNAUTHENTICATED"),
        (403, "PERMISSION_DENIED"),
        (404, "NOT_FOUND"),
        (500, "INTERNAL"),
        (502, "UNKNOWN"),
    ],
)
def test_permanent_errors_are_not_retried(code, status):
    models = _SequencedModels(provider_error(code, status))
    with pytest.raises(GeminiError):
        ask(service_with(models))
    assert models.calls == 1


def test_class_name_words_do_not_make_error_transient():
    class FakeUnavailableError(Exception):
        pass

    models = _SequencedModels(FakeUnavailableError("service unavailable"))
    with pytest.raises(GeminiUnavailableError):
        ask(service_with(models))
    assert models.calls == 1


@pytest.mark.parametrize("max_attempts", [1, 2, 3])
def test_retry_count_is_exactly_bounded(max_attempts):
    service = make_service()
    service.max_attempts = max_attempts
    models = _SequencedModels(
        *[provider_error(503, "UNAVAILABLE") for _ in range(max_attempts)]
    )
    service._client = SimpleNamespace(models=models)
    with pytest.raises(GeminiUnavailableError):
        ask(service)
    assert models.calls == max_attempts


# --- Separate time budgets -------------------------------------------------


def test_504_with_elapsed_attempt_time_is_retried(timing):
    """A realistic 504 consumes a full attempt but budget remains."""
    clock, _ = timing
    models = _SequencedModels(
        slow_error(clock, 30.0, provider_error(504, "DEADLINE_EXCEEDED")),
        '{"answer": "ok"}',
    )
    service = service_with(models, timeout=30.0, retry_budget_seconds=90.0)
    assert ask(service) == '{"answer": "ok"}'
    assert models.calls == 2


def test_504_is_not_retried_when_budget_is_exhausted(timing):
    clock, _ = timing
    models = _SequencedModels(
        slow_error(clock, 90.0, provider_error(504, "DEADLINE_EXCEEDED")),
        '{"answer": "ok"}',
    )
    service = service_with(models, timeout=30.0, retry_budget_seconds=90.0)
    with pytest.raises(GeminiTimeoutError):
        ask(service)
    assert models.calls == 1


def test_sleeps_and_elapsed_time_fit_retry_budget(timing):
    clock, delays = timing
    models = _SequencedModels(*[provider_error(503, "UNAVAILABLE") for _ in range(3)])
    service = service_with(models, timeout=30.0, retry_budget_seconds=90.0)
    with pytest.raises(GeminiUnavailableError):
        ask(service)
    assert delays
    assert all(0 <= delay <= service.retry_max_delay_seconds for delay in delays)
    assert clock.now - 1000.0 <= 90.0 + 1e-6


def test_backoff_budget_caps_total_sleep(timing):
    _, delays = timing
    models = _SequencedModels(*[provider_error(503, "UNAVAILABLE") for _ in range(5)])
    service = service_with(
        models,
        max_attempts=3,
        retry_backoff_budget_seconds=0.3,
        retry_base_delay_seconds=0.25,
        retry_max_delay_seconds=1.0,
    )
    with pytest.raises(GeminiUnavailableError):
        ask(service)
    assert sum(delays) <= 0.3 + 1e-6


# --- Retry-After parsing ---------------------------------------------------


def test_retry_after_numeric_seconds(timing):
    _, delays = timing
    service = service_with(
        _SequencedModels(retry_after_error("0.5")),
        retry_base_delay_seconds=0.0,
        retry_max_delay_seconds=2.0,
    )
    assert ask(service) == '{"answer": "ok"}'
    assert delays[0] == pytest.approx(0.5)


def test_retry_after_rfc1123_date(timing):
    _, delays = timing
    when = datetime.now(UTC) + timedelta(seconds=5)
    service = service_with(
        _SequencedModels(retry_after_error(format_datetime(when, usegmt=True))),
        retry_base_delay_seconds=0.0,
        retry_max_delay_seconds=2.0,
    )
    assert ask(service) == '{"answer": "ok"}'
    assert delays[0] == pytest.approx(2.0)  # hint capped at the configured max


def test_retry_after_asctime_date(timing):
    _, delays = timing
    when = (datetime.now(UTC) + timedelta(seconds=5)).replace(tzinfo=None)
    value = when.strftime("%a %b %d %H:%M:%S %Y")
    service = service_with(
        _SequencedModels(retry_after_error(value)),
        retry_base_delay_seconds=0.0,
        retry_max_delay_seconds=2.0,
    )
    assert ask(service) == '{"answer": "ok"}'
    assert delays[0] == pytest.approx(2.0)


def test_retry_after_invalid_date_falls_back_to_backoff(timing):
    _, delays = timing
    service = service_with(
        _SequencedModels(retry_after_error("not-a-date")),
        retry_base_delay_seconds=0.0,
        retry_max_delay_seconds=2.0,
    )
    assert ask(service) == '{"answer": "ok"}'
    assert delays[0] == 0.0


def test_retry_after_above_maximum_is_capped(timing):
    _, delays = timing
    service = service_with(
        _SequencedModels(retry_after_error("30")),
        retry_base_delay_seconds=0.0,
        retry_max_delay_seconds=2.0,
    )
    assert ask(service) == '{"answer": "ok"}'
    assert delays[0] == pytest.approx(2.0)


# --- SDK retry assumption and thread safety --------------------------------


def test_sdk_retry_options_are_left_unset(monkeypatch):
    """google-genai 3.5.0 does not add nested status retries in this setup."""
    from google import genai

    captured: dict[str, object] = {}

    def fake_client(**kwargs):
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(genai, "Client", fake_client)
    make_service()._client_or_raise()
    assert captured["http_options"].retry_options is None
    assert "retry_options" not in captured


def test_concurrent_lazy_client_initialization(monkeypatch):
    from google import genai

    created: list[object] = []
    barrier = threading.Barrier(6)

    def fake_client(**kwargs):
        created.append(kwargs)
        real_time.sleep(0.01)  # widen the race window
        return object()

    monkeypatch.setattr(genai, "Client", fake_client)
    service = make_service()
    results: list[object] = []
    errors: list[Exception] = []

    def worker() -> None:
        try:
            barrier.wait()
            results.append(service._client_or_raise())
        except Exception as exc:  # noqa: BLE001 - collect thread failures below
            errors.append(exc)

    threads = [threading.Thread(target=worker) for _ in range(6)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert not errors
    assert len(created) == 1
    assert len({id(result) for result in results}) == 1


# --- Settings validation ---------------------------------------------------


def test_retry_settings_are_bounded():
    assert (
        Settings(assistant_max_attempts=2, _env_file=None).assistant_max_attempts == 2
    )
    with pytest.raises(ValidationError):
        Settings(assistant_max_attempts=10, _env_file=None)
    with pytest.raises(ValidationError):
        Settings(assistant_retry_base_delay_seconds=-1, _env_file=None)
    with pytest.raises(ValidationError):
        Settings(assistant_retry_budget_seconds=1000, _env_file=None)
    with pytest.raises(ValidationError):
        Settings(
            assistant_retry_budget_seconds=10,
            assistant_request_timeout_seconds=30,
            _env_file=None,
        )
    with pytest.raises(ValidationError):
        Settings(
            assistant_retry_base_delay_seconds=5,
            assistant_retry_max_delay_seconds=1,
            _env_file=None,
        )


def test_client_retry_budget_is_clamped_and_validated():
    service = GeminiService(
        api_key="k",
        model="m",
        timeout=30.0,
        max_output_tokens=1,
        retry_budget_seconds=5000,
    )
    assert service.retry_budget_seconds == gemini_client.MAX_RETRY_BUDGET_CAP_SECONDS
    with pytest.raises(ValueError):
        GeminiService(
            api_key="k",
            model="m",
            timeout=30.0,
            max_output_tokens=1,
            retry_budget_seconds=30.0,
        )
    with pytest.raises(ValueError):
        GeminiService(
            api_key="k",
            model="m",
            timeout=30.0,
            max_output_tokens=1,
            retry_base_delay_seconds=5.0,
            retry_max_delay_seconds=1.0,
        )
