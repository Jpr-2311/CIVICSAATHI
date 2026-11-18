"""Page-aware, paragraph-respecting chunking with character overlap.

Each chunk belongs to exactly one page, so provenance is never ambiguous.
Overlap is applied only within a page; text from different pages is never
merged. Malayalam and Hindi code points are carried through unchanged — no
transliteration, NFKC folding or ASCII encoding is performed here.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Protocol

_BLANK_LINES = re.compile(r"\n\s*\n+")
_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?।॥])\s+")
_WHITESPACE = re.compile(r"\s")


class PageLike(Protocol):
    page_number: int
    text: str


@dataclass(frozen=True)
class ChunkingConfig:
    chunk_chars: int = 1200
    overlap_chars: int = 200
    min_chunk_chars: int = 40


@dataclass(frozen=True)
class DocumentChunk:
    chunk_index: int
    page_number: int
    text: str
    char_count: int


def _clean(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def _word_units(sentence: str, chunk_size: int) -> list[str]:
    """Pack words into units no longer than chunk_size."""
    units: list[str] = []
    current = ""
    for word in sentence.split():
        candidate = f"{current} {word}".strip()
        if len(candidate) > chunk_size and current:
            units.append(current + "\n")
            current = word
        else:
            current = candidate
    if current:
        units.append(current + "\n")
    return units


def _page_units(text: str, chunk_size: int) -> list[str]:
    """Split one page into sentence/paragraph-sized units."""
    units: list[str] = []
    for paragraph in _BLANK_LINES.split(text):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        paragraph_units: list[str] = []
        for line in paragraph.split("\n"):
            for sentence in _SENTENCE_BOUNDARY.split(line.strip()):
                sentence = sentence.strip()
                if not sentence:
                    continue
                if len(sentence) > chunk_size:
                    paragraph_units.extend(_word_units(sentence, chunk_size))
                else:
                    paragraph_units.append(sentence + "\n")
        if not paragraph_units:
            continue
        # Blank line between paragraphs keeps the original boundary visible.
        paragraph_units[-1] += "\n"
        units.extend(paragraph_units)
    return units


def _overlap_tail(text: str, overlap: int, chunk_size: int) -> str:
    """Return a short, word-aligned suffix used as the next chunk's prefix."""
    if overlap <= 0 or len(text) <= overlap:
        return ""
    tail = text[-overlap:]
    boundary = _WHITESPACE.search(tail)
    if boundary:
        tail = tail[boundary.end() :].lstrip()
    return tail if 0 < len(tail) < chunk_size else ""


def _window_split(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Hard-split a single overlong token/line into overlapping windows."""
    step = max(1, chunk_size - overlap)
    pieces: list[str] = []
    start = 0
    while start < len(text):
        pieces.append(text[start : start + chunk_size])
        if start + chunk_size >= len(text):
            break
        start += step
    return pieces


def _pack_units(units: list[str], chunk_size: int, overlap: int) -> list[str]:
    """Greedily pack units into bounded chunks, carrying a tail as overlap."""
    chunks: list[str] = []
    current_parts: list[str] = []
    current_length = 0

    def flush() -> str:
        nonlocal current_parts, current_length
        text = "".join(current_parts).strip()
        if text:
            chunks.append(text)
        current_parts, current_length = [], 0
        return text

    for unit in units:
        stripped = unit.strip()
        if not stripped:
            continue
        if len(stripped) > chunk_size:
            flush()
            for piece in _window_split(stripped, chunk_size, overlap):
                if piece.strip():
                    chunks.append(piece.strip())
            current_parts = []
            current_length = 0
            tail = _overlap_tail(chunks[-1], overlap, chunk_size) if chunks else ""
            if tail:
                current_parts, current_length = [tail], len(tail)
            continue

        if current_parts and current_length + len(unit) > chunk_size:
            previous = flush()
            tail = _overlap_tail(previous, overlap, chunk_size)
            if tail and len(tail) + len(unit) <= chunk_size:
                current_parts, current_length = [tail], len(tail)

        current_parts.append(unit)
        current_length += len(unit)

    if current_parts:
        flush()
    return chunks


def chunk_pages(
    pages: list[PageLike] | tuple[PageLike, ...],
    *,
    config: ChunkingConfig | None = None,
) -> list[DocumentChunk]:
    """Chunk extracted pages into traceable, non-empty, bounded passages."""
    settings = config or ChunkingConfig()
    chunk_size = settings.chunk_chars
    overlap = settings.overlap_chars
    minimum = settings.min_chunk_chars

    if chunk_size < 1:
        raise ValueError("chunk_chars must be positive.")
    if not 0 <= overlap < chunk_size:
        raise ValueError("overlap_chars must be non-negative and below chunk_chars.")

    raw: list[tuple[int, str]] = []
    page_totals: dict[int, int] = {}
    for page in pages:
        text = _clean(page.text)
        page_totals[page.page_number] = len(text)
        if len(text) < minimum:
            continue
        units = _page_units(text, chunk_size)
        for piece in _pack_units(units, chunk_size, overlap):
            raw.append((page.page_number, piece))

    # Merge a tiny trailing fragment into the previous chunk on the same page
    # instead of creating a near-empty, low-quality vector.
    merged: list[tuple[int, str]] = []
    for page_number, text in raw:
        if len(text) < minimum and merged and merged[-1][0] == page_number:
            previous = merged[-1][1]
            if len(previous) + len(text) + 1 <= chunk_size + overlap:
                merged[-1] = (page_number, f"{previous}\n{text}")
                continue
        if len(text) < minimum and page_totals.get(page_number, 0) < minimum:
            continue
        merged.append((page_number, text))

    return [
        DocumentChunk(
            chunk_index=index,
            page_number=page_number,
            text=text,
            char_count=len(text),
        )
        for index, (page_number, text) in enumerate(merged)
    ]
