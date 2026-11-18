"""Embedding contract tests without loading the real neural model."""

from app.services.embeddings import (
    PASSAGE_PREFIX,
    QUERY_PREFIX,
    EmbeddingService,
)


class RecordingModel:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    def encode(self, texts, **kwargs):
        self.calls.append({"texts": list(texts), "kwargs": kwargs})
        return [[1.0, 0.0] for _ in texts]

    def get_embedding_dimension(self) -> int:
        return 2


def test_passage_and_query_prefixes_and_normalization() -> None:
    service = EmbeddingService("fake-model")
    model = RecordingModel()
    service._model = model  # avoid any real model load

    passages = service.embed_passages(["first", "അഞ്ച്"])
    query = service.embed_query("കർഷകർ")

    assert passages == [[1.0, 0.0], [1.0, 0.0]]
    assert query == [1.0, 0.0]
    assert model.calls[0]["texts"] == [
        f"{PASSAGE_PREFIX}first",
        f"{PASSAGE_PREFIX}അഞ്ച്",
    ]
    assert model.calls[1]["texts"] == [f"{QUERY_PREFIX}കർഷകർ"]
    assert all(call["kwargs"]["normalize_embeddings"] is True for call in model.calls)
    assert service.loaded is True


def test_empty_input_does_not_load_a_model() -> None:
    service = EmbeddingService("fake-model")
    assert service.embed_passages([]) == []
    assert service.loaded is False
