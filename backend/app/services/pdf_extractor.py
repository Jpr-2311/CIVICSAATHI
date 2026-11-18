"""Secure, in-memory PDF validation and text extraction.

Uploads are validated by content, never by extension or MIME type alone.
Files are opened from bytes with PyMuPDF's text extractor; embedded scripts,
external resources and annotations are never executed, downloaded or followed.
No user-supplied path is used to open a file.
"""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass

import pymupdf

logger = logging.getLogger(__name__)

PDF_MAGIC = b"%PDF-"
MAX_FILENAME_CHARS = 255
MAX_METADATA_VALUE_CHARS = 500
_METADATA_KEYS = (
    "title",
    "author",
    "subject",
    "keywords",
    "creator",
    "producer",
    "creationDate",
    "modDate",
)
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")


class PDFValidationError(ValueError):
    """A rejected upload, with a safe message and HTTP status for the API."""

    def __init__(self, message: str, *, code: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str


@dataclass(frozen=True)
class ExtractedDocument:
    original_filename: str
    checksum: str
    size_bytes: int
    page_count: int
    total_characters: int
    needs_ocr: bool
    metadata: dict[str, str]
    pages: tuple[ExtractedPage, ...]


def safe_display_filename(filename: str | None) -> str:
    """Return a display-only name with separators and control characters removed.

    This value is never used to build a storage path. Both POSIX and Windows
    separators are stripped so a client cannot smuggle a path into the UI.
    """
    raw = (filename or "").replace("\\", "/").split("/")[-1]
    raw = _CONTROL_CHARS.sub(" ", raw).strip()
    if not raw or raw in {".", ".."}:
        return "document.pdf"
    return raw[:MAX_FILENAME_CHARS]


def _safe_metadata(raw: dict[str, object] | None) -> dict[str, str]:
    if not raw:
        return {}
    cleaned: dict[str, str] = {}
    for key in _METADATA_KEYS:
        value = raw.get(key)
        if value is None:
            continue
        text = _CONTROL_CHARS.sub(" ", str(value)).strip()
        if not text:
            continue
        cleaned[key] = text[:MAX_METADATA_VALUE_CHARS]
    return cleaned


def extract_document(
    *,
    filename: str | None,
    content: bytes,
    max_bytes: int,
    max_pages: int,
    ocr_min_page_chars: int,
) -> ExtractedDocument:
    """Validate and extract text from an uploaded PDF held in memory.

    Raises PDFValidationError with an actionable, non-technical message for
    every rejected document. No filesystem path is involved.
    """
    display_name = safe_display_filename(filename)

    if not content:
        raise PDFValidationError("The uploaded file is empty.", code="empty_file")
    if len(content) > max_bytes:
        raise PDFValidationError(
            "This PDF is larger than the upload limit.",
            code="file_too_large",
            status_code=413,
        )
    # The PDF header may appear after a small prefix of unrelated bytes.
    if PDF_MAGIC not in content[:1024]:
        raise PDFValidationError(
            "This file is not a PDF. Upload a real PDF document.",
            code="invalid_pdf",
        )

    try:
        pdf = pymupdf.open(stream=content, filetype="pdf")
    except Exception as exc:
        logger.warning(
            "Rejected a PDF that could not be opened: %s", type(exc).__name__
        )
        raise PDFValidationError(
            "This PDF is corrupt or unreadable.", code="corrupt_pdf"
        ) from exc

    try:
        if pdf.needs_pass or pdf.is_encrypted:
            raise PDFValidationError(
                "Encrypted PDFs are not supported. Remove the password and retry.",
                code="encrypted_pdf",
            )

        page_count = pdf.page_count
        if page_count < 1:
            raise PDFValidationError("This PDF has no pages.", code="empty_pdf")
        if page_count > max_pages:
            raise PDFValidationError(
                f"This PDF has too many pages (limit: {max_pages}).",
                code="too_many_pages",
                status_code=413,
            )

        pages: list[ExtractedPage] = []
        for index in range(page_count):
            try:
                text = pdf.load_page(index).get_text("text")
            except Exception as exc:
                logger.exception("Could not extract text from PDF page %s", index + 1)
                raise PDFValidationError(
                    "A page in this PDF could not be read.", code="unreadable_page"
                ) from exc
            pages.append(ExtractedPage(page_number=index + 1, text=text))

        metadata = _safe_metadata(pdf.metadata)
    finally:
        pdf.close()

    total_characters = sum(len(page.text.strip()) for page in pages)
    average_per_page = total_characters / page_count
    needs_ocr = average_per_page < ocr_min_page_chars
    if needs_ocr:
        logger.info(
            "PDF '%s' has little extractable text (%s chars/page) and needs OCR",
            display_name,
            round(average_per_page, 1),
        )

    return ExtractedDocument(
        original_filename=display_name,
        checksum=hashlib.sha256(content).hexdigest(),
        size_bytes=len(content),
        page_count=page_count,
        total_characters=total_characters,
        needs_ocr=needs_ocr,
        metadata=metadata,
        pages=tuple(pages),
    )
