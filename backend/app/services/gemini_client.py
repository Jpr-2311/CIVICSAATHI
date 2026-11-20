"""Lazy wrapper around the official Google Gen AI SDK.

The SDK is imported only on first use, so importing the API and running unit
tests with an injected fake never opens a network client. Only the API key and
bounded generation settings are held here; prompts and responses are never
logged, and no key is ever returned to a caller.

Timing model
------------
* ``timeout`` is the **per-attempt** HTTP timeout in seconds. It is converted
  to milliseconds for the SDK's ``HttpOptions``.
* ``retry_budget_seconds`` is a monotonic budget for the whole retry sequence
  (every attempt plus every backoff sleep).
* ``retry_backoff_budget_seconds`` separately bounds cumulative sleep time.

Limitation: the synchronous google-genai client cannot cancel an in-flight
``generate_content`` call. These budgets bound our own sleeps and the number of
attempts, but they are **not** a hard end-to-end deadline. A call that hangs
inside the SDK is bounded only by the per-attempt HTTP timeout.
"""

from __future__ import annotations

import logging
import random
import threading
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from time import monotonic, sleep
from typing import Protocol

from app.services.assistant_errors import (
    AssistantNotConfiguredError,
    GeminiError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    GeminiUnavailableError,
)

logger = logging.getLogger(__name__)

# Transport retries are bounded even if a caller bypasses Settings validation.
MAX_ATTEMPTS_CAP = 5
MAX_RETRY_DELAY_CAP_SECONDS = 30.0
MAX_RETRY_BUDGET_CAP_SECONDS = 900.0
MAX_BACKOFF_BUDGET_CAP_SECONDS = 60.0
RETRY_JITTER_RATIO = 0.25
# A retry is only started if at least this fraction of the total budget remains.
# This prevents one attempt from consuming the entire retry budget.
MIN_ATTEMPT_BUDGET_RATIO = 0.25

# Canonical gRPC/generateContent status strings. Anything outside this set is
# omitted from logs: provider messages and ``details`` may contain raw bodies.
SAFE_PROVIDER_STATUSES = frozenset(
    {
        "OK",
        "CANCELLED",
        "UNKNOWN",
        "INVALID_ARGUMENT",
        "DEADLINE_EXCEEDED",
        "NOT_FOUND",
        "ALREADY_EXISTS",
        "PERMISSION_DENIED",
        "RESOURCE_EXHAUSTED",
        "FAILED_PRECONDITION",
        "ABORTED",
        "OUT_OF_RANGE",
        "UNIMPLEMENTED",
        "INTERNAL",
        "UNAVAILABLE",
        "DATA_LOSS",
        "UNAUTHENTICATED",
    }
)

_TRANSIENT_PAIRS = {
    429: "RESOURCE_EXHAUSTED",
    503: "UNAVAILABLE",
    504: "DEADLINE_EXCEEDED",
}


def _safe_error_category(exc: Exception) -> str:
    """Classify an exception using only structured, non-sensitive signals."""
    code = getattr(exc, "code", None)
    status = getattr(exc, "status", None)
    status_name = status.upper() if isinstance(status, str) else ""
    if code == 429 or status_name == "RESOURCE_EXHAUSTED":
        return "rate_limited"
    if code in (408, 504) or status_name == "DEADLINE_EXCEEDED":
        return "deadline_exceeded"
    if code in (500, 502, 503) or status_name in {"INTERNAL", "UNAVAILABLE"}:
        return "unavailable"
    if code in (401, 403) or status_name in {
        "UNAUTHENTICATED",
        "PERMISSION_DENIED",
    }:
        return "authentication"
    if code == 404 or status_name == "NOT_FOUND":
        return "not_found"
    if code == 400 or status_name in {
        "INVALID_ARGUMENT",
        "FAILED_PRECONDITION",
        "OUT_OF_RANGE",
    }:
        return "invalid_request"
    if isinstance(exc, TimeoutError):
        return "timeout"
    return "other"


def _safe_provider_diagnostics(exc: Exception) -> str:
    """Return only a bounded status code, allowlisted status and category.

    ``message``, ``details``, ``str(exc)``, headers, prompts and document text
    are never read. The SDK may populate ``message`` with the raw HTTP body.
    """
    code = getattr(exc, "code", None)
    status = getattr(exc, "status", None)
    parts: list[str] = []
    if isinstance(code, int) and not isinstance(code, bool) and 100 <= code <= 599:
        parts.append(f"code={code}")
    if isinstance(status, str) and status.upper() in SAFE_PROVIDER_STATUSES:
        parts.append(f"status={status.upper()}")
    parts.append(f"category={_safe_error_category(exc)}")
    return ", ".join(parts)


# Gemini may only return ids and control flags. Document metadata is populated
# by the backend from the retrieved passages, never from model output.
# `additionalProperties` is deliberately absent: the generateContent API rejects
# it in a response_schema, and the SDK's wire serialization emits it as
# `additional_properties` both at the root and inside array item schemas.
# Output shape is still constrained by the typed fields and required lists
# below, and the backend validates every citation against retrieved evidence.
GENERATION_SCHEMA: dict[str, object] = {
    "type": "OBJECT",
    "properties": {
        "answer": {"type": "STRING"},
        "language": {"type": "STRING", "enum": ["en", "ml", "hi"]},
        "evidence_found": {"type": "BOOLEAN"},
        "insufficient_evidence": {"type": "BOOLEAN"},
        "citations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {"evidence_id": {"type": "STRING"}},
                "required": ["evidence_id"],
            },
        },
    },
    "required": [
        "answer",
        "language",
        "evidence_found",
        "insufficient_evidence",
        "citations",
    ],
}


class GeminiProvider(Protocol):
    """The tiny surface the RAG service needs; fakes implement this in tests."""

    @property
    def available(self) -> bool: ...

    def generate(self, *, system_instruction: str, prompt: str) -> str: ...


class GeminiService:
    """Official `google-genai` client with bounded retries and safe errors."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        timeout: float,
        max_output_tokens: int,
        max_attempts: int = 3,
        retry_budget_seconds: float | None = None,
        retry_backoff_budget_seconds: float = 10.0,
        retry_base_delay_seconds: float = 0.25,
        retry_max_delay_seconds: float = 2.0,
    ) -> None:
        self._api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_output_tokens = max_output_tokens
        self.max_attempts = max(1, min(max_attempts, MAX_ATTEMPTS_CAP))
        self.retry_base_delay_seconds = max(
            0.0, min(retry_base_delay_seconds, MAX_RETRY_DELAY_CAP_SECONDS)
        )
        self.retry_max_delay_seconds = max(
            0.0, min(retry_max_delay_seconds, MAX_RETRY_DELAY_CAP_SECONDS)
        )
        if self.retry_base_delay_seconds > self.retry_max_delay_seconds:
            raise ValueError(
                "retry_base_delay_seconds must not exceed retry_max_delay_seconds."
            )
        # By default allow one full timeout per attempt, plus a little slack.
        if retry_budget_seconds is None:
            retry_budget_seconds = max(
                self.timeout + 1.0, self.timeout * self.max_attempts
            )
        self.retry_budget_seconds = max(
            0.0, min(retry_budget_seconds, MAX_RETRY_BUDGET_CAP_SECONDS)
        )
        if self.retry_budget_seconds <= self.timeout:
            raise ValueError(
                "retry_budget_seconds must be greater than the per-attempt timeout."
            )
        self.retry_backoff_budget_seconds = max(
            0.0, min(retry_backoff_budget_seconds, MAX_BACKOFF_BUDGET_CAP_SECONDS)
        )
        self._client: object | None = None
        self._client_lock = threading.Lock()

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    def _client_or_raise(self) -> object:
        if self._client is not None:
            return self._client
        # Double-checked locking: concurrent first requests must not each build
        # a separate SDK client.
        with self._client_lock:
            if self._client is not None:
                return self._client
            if not self.available:
                raise AssistantNotConfiguredError(
                    "The AI assistant is not configured on this server. Ask an "
                    "administrator to set GEMINI_API_KEY."
                )
            try:
                from google import genai
                from google.genai import types
            except ImportError as exc:  # pragma: no cover - dependency is pinned
                raise GeminiError(
                    "The AI provider library is not installed on the server."
                ) from exc
            # The SDK's HttpOptions.timeout is measured in milliseconds, while
            # the application setting (and self.timeout) stays in seconds.
            timeout_ms = round(self.timeout * 1000)
            try:
                # retry_options is intentionally left unset. In google-genai
                # 3.5.0, retry_args(None) returns stop_after_attempt(1), so the
                # SDK adds no status-code retries; the synchronous httpx path
                # has no implicit retry loop. Application retries therefore do
                # not multiply into nested SDK retries.
                self._client = genai.Client(
                    api_key=self._api_key,
                    http_options=types.HttpOptions(timeout=timeout_ms),
                )
            except Exception as exc:
                logger.warning(
                    "Gemini client initialisation failed: %s (%s)",
                    type(exc).__name__,
                    _safe_provider_diagnostics(exc),
                )
                raise GeminiError("The AI service could not be initialised.") from exc
            return self._client

    @staticmethod
    def _map_error(exc: Exception) -> GeminiError:
        """Map provider exceptions without recording prompts or keys."""
        diagnostics = _safe_provider_diagnostics(exc)
        name = type(exc).__name__.lower()
        code = getattr(exc, "code", None)
        if "timeout" in name or "timedout" in name or code in (408, 504):
            logger.warning("Gemini request timed out: %s", diagnostics)
            return GeminiTimeoutError(
                "The AI service took too long to respond. Please try again."
            )
        if (
            code == 429
            or "ratelimit" in name
            or "resourceexhausted" in name
            or "quota" in name
        ):
            logger.warning("Gemini rate limit reached: %s", diagnostics)
            return GeminiRateLimitError(
                "The AI service is busy right now. Please try again shortly."
            )
        if (
            code in (500, 502, 503, 504)
            or "unavailable" in name
            or "serviceunavailable" in name
            or "internal" in name
        ):
            logger.warning(
                "Gemini service error (%s): %s", type(exc).__name__, diagnostics
            )
            return GeminiUnavailableError(
                "The AI service is temporarily unavailable. Please try again."
            )
        logger.warning(
            "Gemini request failed (%s): %s", type(exc).__name__, diagnostics
        )
        return GeminiError(
            "The AI service could not complete this request. Please try again."
        )

    @staticmethod
    def _is_transient(exc: Exception) -> bool:
        """Retry only the three structured transient provider failures.

        HTTP code is the primary signal. A recognized but mismatched status is
        treated as permanent; class names are deliberately ignored.
        """
        code = getattr(exc, "code", None)
        status = getattr(exc, "status", None)
        status_name = status.upper() if isinstance(status, str) else ""
        if isinstance(code, int) and not isinstance(code, bool):
            expected = _TRANSIENT_PAIRS.get(code)
            if expected is None:
                return False
            return status_name in {"", expected}
        return status_name in set(_TRANSIENT_PAIRS.values())

    @staticmethod
    def _retry_after_seconds(exc: Exception) -> float | None:
        """Parse a bounded Retry-After hint (seconds or any HTTP-date format).

        Naive HTTP-dates are normalized to UTC before subtraction. Values above
        the configured maximum delay are intentionally capped by _retry_delay.
        """
        response = getattr(exc, "response", None)
        headers = getattr(response, "headers", None)
        if headers is None:
            return None
        try:
            value = headers.get("retry-after")
            if value is None:
                value = headers.get("Retry-After")
        except (AttributeError, TypeError):
            return None
        if value is None:
            return None
        raw = str(value).strip()
        if not raw:
            return None
        try:
            return max(0.0, float(raw))
        except ValueError:
            pass
        try:
            retry_at = parsedate_to_datetime(raw)
            if retry_at is None:
                return None
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=UTC)
            return max(0.0, (retry_at - datetime.now(UTC)).total_seconds())
        except (TypeError, ValueError, OverflowError):
            return None

    def _minimum_attempt_budget(self) -> float:
        """Smallest remaining budget that is worth starting another attempt."""
        return min(self.timeout, self.retry_budget_seconds * MIN_ATTEMPT_BUDGET_RATIO)

    def _retry_delay(
        self,
        exc: Exception,
        attempt: int,
        retry_deadline: float,
        backoff_used: float,
    ) -> float | None:
        """Exponential backoff with jitter, capped by all budget constraints."""
        remaining_budget = retry_deadline - monotonic()
        remaining_backoff = self.retry_backoff_budget_seconds - backoff_used
        if remaining_budget <= 0 or remaining_backoff <= 0:
            return None
        base = self.retry_base_delay_seconds * (2 ** (attempt - 1))
        delay = min(
            base * (1 + random.uniform(0, RETRY_JITTER_RATIO)),
            self.retry_max_delay_seconds,
        )
        hinted = self._retry_after_seconds(exc)
        if hinted is not None:
            # Retry-After above retry_max_delay_seconds is intentionally capped.
            delay = max(delay, min(hinted, self.retry_max_delay_seconds))
        return max(0.0, min(delay, remaining_budget, remaining_backoff))

    def generate(self, *, system_instruction: str, prompt: str) -> str:
        """Return raw JSON text from Gemini, or raise a safe GeminiError.

        Retry budgets bound our sleeps and attempt count; see the module
        docstring for the synchronous SDK's cancellation limitation.
        """
        client = self._client_or_raise()
        try:
            from google.genai import types
        except ImportError as exc:  # pragma: no cover - dependency is pinned
            raise GeminiError(
                "The AI provider library is not installed on the server."
            ) from exc

        # The typed Schema is used because SDK 3.5.0 serializes schema field
        # names onto the wire; the unsupported `additionalProperties` key has
        # been removed at every level of GENERATION_SCHEMA (see definition).
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=types.Schema(**GENERATION_SCHEMA),
            temperature=0,
            max_output_tokens=self.max_output_tokens,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        retry_deadline = monotonic() + self.retry_budget_seconds
        backoff_used = 0.0
        last_error: Exception | None = None
        for attempt in range(1, self.max_attempts + 1):
            if attempt > 1 and (
                retry_deadline - monotonic() < self._minimum_attempt_budget()
            ):
                break
            try:
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config,
                )
            except Exception as exc:
                last_error = exc
                if not self._is_transient(exc) or attempt == self.max_attempts:
                    raise self._map_error(exc) from exc
                delay = self._retry_delay(exc, attempt, retry_deadline, backoff_used)
                if delay is None:
                    raise self._map_error(exc) from exc
                logger.warning(
                    "Gemini transient error (attempt %d/%d); retrying in %.3fs: %s",
                    attempt,
                    self.max_attempts,
                    delay,
                    _safe_provider_diagnostics(exc),
                )
                sleep(delay)
                backoff_used += delay
                continue

            text = getattr(response, "text", None)
            if not isinstance(text, str) or not text.strip():
                raise GeminiError("The AI service returned an empty response.")
            return text

        # Reached only when a transient error left too little budget for the
        # next attempt.
        if last_error is not None:
            raise self._map_error(last_error) from last_error
        raise GeminiError(
            "The AI service could not complete this request. Please try again."
        )
