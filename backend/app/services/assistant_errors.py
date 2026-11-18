"""Safe error types shared by the assistant service and Gemini provider."""

from __future__ import annotations


class AssistantServiceError(RuntimeError):
    """Base class mapped to a consistent HTTP envelope by the app handler."""

    status_code = 500
    code = "assistant_error"


class AssistantNotConfiguredError(AssistantServiceError):
    status_code = 503
    code = "assistant_not_configured"


class GeminiError(AssistantServiceError):
    status_code = 502
    code = "gemini_error"


class GeminiTimeoutError(GeminiError):
    status_code = 504
    code = "gemini_timeout"


class GeminiRateLimitError(GeminiError):
    status_code = 429
    code = "gemini_rate_limited"


class GeminiUnavailableError(GeminiError):
    status_code = 503
    code = "gemini_unavailable"
