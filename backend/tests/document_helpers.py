"""Shared fixtures for Day 3 document tests (tiny PDFs, no model download)."""

from __future__ import annotations

import pymupdf

CONCEPTS: tuple[tuple[tuple[str, ...], list[float]], ...] = (
    (
        ("farmer", "agriculture", "crop", "കർഷക", "കൃഷി", "किसान", "कृषि"),
        [1.0, 0.0, 0.0, 0.0],
    ),
    (
        (
            "scholarship",
            "student",
            "study",
            "സ്കോളർഷിപ്പ്",
            "വിദ്യാർത്ഥി",
            "छात्रवृत्ति",
            "विद्यार्थी",
        ),
        [0.0, 1.0, 0.0, 0.0],
    ),
    (
        ("health", "medical", "hospital", "ആരോഗ്യ", "ചികിത്സ", "स्वास्थ्य", "अस्पताल"),
        [0.0, 0.0, 1.0, 0.0],
    ),
)


def make_pdf(
    pages: list[str],
    *,
    metadata: dict[str, str] | None = None,
    encrypted: bool = False,
) -> bytes:
    """Create a small text PDF entirely in memory."""
    document = pymupdf.open()
    try:
        for text in pages:
            page = document.new_page()
            if text:
                page.insert_text((72, 72), text, fontsize=11, fontname="helv")
        if metadata:
            document.set_metadata(metadata)
        options = {"deflate": True}
        if encrypted:
            options.update(
                encryption=pymupdf.PDF_ENCRYPT_AES_256,
                owner_pw="owner",
                user_pw="secret",
            )
        return document.tobytes(**options)
    finally:
        document.close()


class FakeEmbedder:
    """Deterministic cross-language embedder for fast, reliable unit tests.

    It also records calls so tests can assert the e5 prefixes are applied.
    Unrelated queries receive an opposing vector, producing distance > 1 so
    the no-evidence path can be exercised.
    """

    def __init__(self) -> None:
        self.passage_calls: list[str] = []
        self.query_calls: list[str] = []

    def _vector(self, text: str) -> list[float]:
        lowered = text.casefold()
        for keywords, vector in CONCEPTS:
            if any(keyword in lowered for keyword in keywords):
                return list(vector)
        return [-1.0, -1.0, -1.0, -1.0]

    def embed_passages(self, texts: list[str]) -> list[list[float]]:
        self.passage_calls.extend(texts)
        return [self._vector(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        self.query_calls.append(text)
        return self._vector(text)
