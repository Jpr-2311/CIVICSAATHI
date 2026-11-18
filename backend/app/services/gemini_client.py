"""Lazy wrapper around the official Google Gen AI SDK.

The SDK is imported only on first use, so importing the API and running unit
tests with an injected fake never opens a network client. Only the API key and
bounded generation settings are held here; prompts and responses are never
logged, and no key is ever returned to a caller.
"""

from __future__ import annotations

import logging
from typing import Protocol

from app.services.assistant_errors import (
    AssistantNotConfiguredError,
    GeminiError,
    GeminiRateLimitError,
    GeminiTimeoutError,
    GeminiUnavailableError,
)

logger = logging.getLogger(__name__)

# Gemini may only return ids and control flags. Document metadata is populated
# by the backend from the retrieved passages, never from model output.
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
                "additionalProperties": False,
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
    "additionalProperties": False,
}


class GeminiProvider(Protocol):
    """The tiny surface the RAG service needs; fakes implement this in tests."""

    @property
    def available(self) -> bool: ...

    def generate(self, *, system_instruction: str, prompt: str) -> str: ...


class GeminiService:
    """Official `google-genai` client with timeouts and safe error mapping."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        timeout: float,
        max_output_tokens: int,
    ) -> None:
        self._api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_output_tokens = max_output_tokens
        self._client: object | None = None

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    def _client_or_raise(self) -> object:
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
        try:
            self._client = genai.Client(
                api_key=self._api_key,
                http_options=types.HttpOptions(timeout=self.timeout),
            )
        except Exception as exc:
            logger.warning(
                "Gemini client initialisation failed: %s", type(exc).__name__
            )
            raise GeminiError("The AI service could not be initialised.") from exc
        return self._client

    @staticmethod
    def _map_error(exc: Exception) -> GeminiError:
        """Map provider exceptions without recording prompts or keys."""
        name = type(exc).__name__.lower()
        code = getattr(exc, "code", None)
        if "timeout" in name or "timedout" in name or code in (408, 504):
            logger.warning("Gemini request timed out")
            return GeminiTimeoutError(
                "The AI service took too long to respond. Please try again."
            )
        if (
            code == 429
            or "ratelimit" in name
            or "resourceexhausted" in name
            or "quota" in name
        ):
            logger.warning("Gemini rate limit reached")
            return GeminiRateLimitError(
                "The AI service is busy right now. Please try again shortly."
            )
        if (
            code in (500, 502, 503, 504)
            or "unavailable" in name
            or "serviceunavailable" in name
            or "internal" in name
        ):
            logger.warning("Gemini service error: %s", type(exc).__name__)
            return GeminiUnavailableError(
                "The AI service is temporarily unavailable. Please try again."
            )
        logger.warning("Gemini request failed: %s", type(exc).__name__)
        return GeminiError(
            "The AI service could not complete this request. Please try again."
        )

    def generate(self, *, system_instruction: str, prompt: str) -> str:
        """Return raw JSON text from Gemini, or raise a safe GeminiError."""
        client = self._client_or_raise()
        try:
            from google.genai import types
        except ImportError as exc:  # pragma: no cover - dependency is pinned
            raise GeminiError(
                "The AI provider library is not installed on the server."
            ) from exc

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=GENERATION_SCHEMA,
            temperature=0,
            max_output_tokens=self.max_output_tokens,
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        try:
            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
        except Exception as exc:
            raise self._map_error(exc) from exc

        text = getattr(response, "text", None)
        if not isinstance(text, str) or not text.strip():
            raise GeminiError("The AI service returned an empty response.")
        return text
