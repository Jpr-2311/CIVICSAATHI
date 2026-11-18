"""Multilingual sentence embeddings for passages and queries.

The model is loaded lazily so importing the API (and running unit tests with
an injected fake embedder) never downloads or initialises a neural network.
`passage: ` and `query: ` prefixes follow the multilingual-e5 contract.
"""

from __future__ import annotations

import logging
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)

PASSAGE_PREFIX = "passage: "
QUERY_PREFIX = "query: "


class EmbeddingError(RuntimeError):
    """Raised when embeddings cannot be produced. Never swallowed."""


@runtime_checkable
class EmbeddingProvider(Protocol):
    """The small surface the storage layer needs."""

    def embed_passages(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class EmbeddingService:
    """Lazy wrapper around sentence-transformers' multilingual-e5 model."""

    def __init__(self, model_name: str, *, normalize: bool = True) -> None:
        self.model_name = model_name
        self.normalize = normalize
        self._model: object | None = None
        self._dimension: int | None = None

    @property
    def loaded(self) -> bool:
        return self._model is not None

    @property
    def dimension(self) -> int | None:
        return self._dimension

    def load(self) -> object:
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise EmbeddingError(
                "sentence-transformers is not installed on the server."
            ) from exc
        try:
            model = SentenceTransformer(self.model_name)
        except Exception as exc:
            logger.exception("Could not load embedding model %s", self.model_name)
            raise EmbeddingError(
                "The multilingual embedding model could not be loaded. Check "
                "network access or the local Hugging Face cache."
            ) from exc
        self._model = model
        dimension_getter = getattr(model, "get_embedding_dimension", None) or getattr(
            model, "get_sentence_embedding_dimension", None
        )
        if dimension_getter is not None:
            try:
                self._dimension = int(dimension_getter())
            except (AttributeError, TypeError, ValueError):  # pragma: no cover
                self._dimension = None
        logger.info(
            "Loaded embedding model %s (dim=%s)", self.model_name, self._dimension
        )
        return model

    def _encode(self, texts: list[str], prefix: str) -> list[list[float]]:
        if not texts:
            return []
        model = self.load()
        try:
            vectors = model.encode(
                [f"{prefix}{text}" for text in texts],
                batch_size=32,
                convert_to_numpy=True,
                normalize_embeddings=self.normalize,
                show_progress_bar=False,
            )
        except Exception as exc:
            logger.exception("Embedding generation failed for %s texts", len(texts))
            raise EmbeddingError("Text could not be embedded.") from exc
        return [[float(value) for value in vector] for vector in vectors]

    def embed_passages(self, texts: list[str]) -> list[list[float]]:
        return self._encode(texts, PASSAGE_PREFIX)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([text], QUERY_PREFIX)[0]


__all__ = [
    "PASSAGE_PREFIX",
    "QUERY_PREFIX",
    "EmbeddingError",
    "EmbeddingProvider",
    "EmbeddingService",
]
