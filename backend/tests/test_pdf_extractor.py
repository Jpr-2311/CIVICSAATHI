"""PDF content validation, extraction and honest OCR flagging."""

import pytest
from document_helpers import make_pdf

from app.services.pdf_extractor import PDFValidationError, extract_document

LIMITS = {
    "max_bytes": 2_000_000,
    "max_pages": 10,
    "ocr_min_page_chars": 80,
}


def extract(content: bytes, filename: str = "notice.pdf", **overrides):
    return extract_document(filename=filename, content=content, **(LIMITS | overrides))


def test_valid_pdf_extracts_pages_and_metadata() -> None:
    content = make_pdf(
        [
            "Farmers can apply for crop support and irrigation assistance at the village office. "
            * 2,
            "Students may apply for scholarships and study grants at the district office. "
            * 2,
        ],
        metadata={"title": "Official Kerala Notice", "author": "Department"},
    )
    result = extract(content)

    assert result.page_count == 2
    assert [page.page_number for page in result.pages] == [1, 2]
    assert "Farmers" in result.pages[0].text
    assert "Students" in result.pages[1].text
    assert result.total_characters > 40
    assert result.needs_ocr is False
    assert result.metadata["title"] == "Official Kerala Notice"
    assert result.metadata["author"] == "Department"
    assert len(result.checksum) == 64
    assert result.original_filename == "notice.pdf"


def test_rejects_non_pdf_content() -> None:
    with pytest.raises(PDFValidationError) as error:
        extract(b"this is not a pdf")
    assert error.value.code == "invalid_pdf"
    assert error.value.status_code == 400


def test_rejects_empty_upload() -> None:
    with pytest.raises(PDFValidationError) as error:
        extract(b"")
    assert error.value.code == "empty_file"


def test_rejects_oversized_upload() -> None:
    content = make_pdf(["Farmers can apply for crop support."])
    with pytest.raises(PDFValidationError) as error:
        extract(content, max_bytes=10)
    assert error.value.code == "file_too_large"
    assert error.value.status_code == 413


def test_rejects_encrypted_pdf() -> None:
    content = make_pdf(["Secret notice."], encrypted=True)
    with pytest.raises(PDFValidationError) as error:
        extract(content)
    assert error.value.code == "encrypted_pdf"


def test_rejects_too_many_pages() -> None:
    content = make_pdf(["One", "Two", "Three"])
    with pytest.raises(PDFValidationError) as error:
        extract(content, max_pages=2)
    assert error.value.code == "too_many_pages"


def test_scanned_or_blank_pdf_is_marked_for_ocr() -> None:
    result = extract(make_pdf([""]))
    assert result.needs_ocr is True
    assert result.total_characters == 0


def test_corrupt_pdf_header_is_rejected() -> None:
    with pytest.raises(PDFValidationError) as error:
        extract(b"%PDF-1.7\nthis is not really a pdf document")
    assert error.value.code == "corrupt_pdf"


def test_uploaded_filename_is_reduced_to_a_safe_display_name() -> None:
    content = make_pdf(["Farmers can apply for crop support."])
    assert extract(content, "../../etc/passwd.pdf").original_filename == "passwd.pdf"
    assert extract(content, "..\\..\\windows\\evil.pdf").original_filename == "evil.pdf"
    assert extract(content, "").original_filename == "document.pdf"
