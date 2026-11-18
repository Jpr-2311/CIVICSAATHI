"""Page provenance, overlap, Unicode preservation and empty-chunk filtering."""

from dataclasses import dataclass
from itertools import pairwise

from app.services.chunker import ChunkingConfig, chunk_pages
from app.services.pdf_extractor import ExtractedPage


@dataclass(frozen=True)
class FakePage:
    page_number: int
    text: str


def test_page_provenance_is_preserved_and_pages_are_not_merged() -> None:
    first = FakePage(1, "Farmers may apply for crop support. " * 8)
    second = FakePage(2, "Students may apply for a study grant. " * 8)
    chunks = chunk_pages(
        [first, second],
        config=ChunkingConfig(chunk_chars=120, overlap_chars=20, min_chunk_chars=10),
    )

    assert chunks
    assert {chunk.page_number for chunk in chunks} == {1, 2}
    for chunk in chunks:
        assert (chunk.page_number == 1 and "Farmers" in chunk.text) or (
            chunk.page_number == 2 and "Students" in chunk.text
        )
        assert chunk.char_count == len(chunk.text)
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))


def test_overlap_repeats_the_previous_chunks_tail() -> None:
    text = "alpha beta gamma delta epsilon zeta theta iota kappa " * 12
    chunks = chunk_pages(
        [ExtractedPage(1, text)],
        config=ChunkingConfig(chunk_chars=140, overlap_chars=40, min_chunk_chars=20),
    )

    assert len(chunks) > 1
    overlap_found = False
    for previous, current in pairwise(chunks):
        for start in range(max(0, len(previous.text) - 60), len(previous.text)):
            if previous.text[start:] and previous.text[start:] in current.text:
                overlap_found = True
                break
    assert overlap_found


def test_empty_and_unusable_pages_are_filtered() -> None:
    assert chunk_pages([ExtractedPage(1, ""), ExtractedPage(2, "   \n")]) == []
    assert (
        chunk_pages(
            [ExtractedPage(1, "tiny")],
            config=ChunkingConfig(
                chunk_chars=100, overlap_chars=10, min_chunk_chars=40
            ),
        )
        == []
    )


def test_malayalam_and_hindi_unicode_is_preserved_exactly() -> None:
    malayalam = "കർഷകർക്ക് കൃഷി സഹായം ലഭിക്കും. " * 12
    hindi = "किसानों को कृषि सहायता मिलेगी। " * 12
    chunks = chunk_pages(
        [ExtractedPage(4, malayalam), ExtractedPage(5, hindi)],
        config=ChunkingConfig(chunk_chars=120, overlap_chars=20, min_chunk_chars=20),
    )

    combined = "\n".join(chunk.text for chunk in chunks)
    assert "കർഷകർക്ക്" in combined
    assert "കൃഷി സഹായം" in combined
    assert "किसानों" in combined
    assert "कृषि सहायता" in combined
    assert {chunk.page_number for chunk in chunks} == {4, 5}


def test_paragraph_boundaries_are_kept() -> None:
    text = "First paragraph about crops.\n\nSecond paragraph about irrigation."
    chunks = chunk_pages(
        [ExtractedPage(1, text)],
        config=ChunkingConfig(chunk_chars=500, overlap_chars=50, min_chunk_chars=10),
    )
    assert len(chunks) == 1
    assert "\n\n" in chunks[0].text


def test_invalid_configuration_is_rejected() -> None:
    try:
        chunk_pages(
            [ExtractedPage(1, "some text")],
            config=ChunkingConfig(chunk_chars=50, overlap_chars=50),
        )
    except ValueError:
        pass
    else:
        raise AssertionError("overlap equal to chunk size must be rejected")
