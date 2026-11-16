"""Read-only access to the curated government scheme dataset.

Why JSON on Day 2 instead of Supabase:
- the API and UI can be built and tested without external credentials;
- the demo stays reproducible if a network or database is unavailable;
- the repository boundary keeps a future Supabase implementation behind
  the same query surface.

The whole dataset is validated by Pydantic before any record is served.
A malformed record is a deployment error, not something the API silently
patches at request time. An empty or invalid dataset is reported honestly
as unavailable rather than filled with invented schemes.
"""

from __future__ import annotations

import json
import logging
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from app.models.schemes import (
    GovernmentLevel,
    Scheme,
    SchemeCategory,
    SchemeDataset,
)

logger = logging.getLogger(__name__)


class DatasetUnavailableError(RuntimeError):
    """Raised when the curated dataset cannot be loaded or validated."""


@dataclass(frozen=True)
class DatasetStatus:
    """Health snapshot of the curated scheme dataset."""

    path: str
    scheme_count: int
    available: bool
    detail: str


def _search_key(value: str) -> str:
    """Normalise text for case-insensitive, script-independent search."""
    return unicodedata.normalize("NFKC", value).casefold()


def _haystack(scheme: Scheme) -> str:
    parts = [
        scheme.id,
        scheme.name.en,
        scheme.name.ml,
        scheme.name.hi,
        scheme.short_name.en,
        scheme.short_name.ml,
        scheme.short_name.hi,
        scheme.summary.en,
        scheme.summary.ml,
        scheme.summary.hi,
        scheme.department.en,
        scheme.department.ml,
        scheme.department.hi,
        *scheme.keywords,
    ]
    return _search_key(" ".join(parts))


class SchemeRepository:
    """Read-only, validated JSON-backed scheme repository."""

    def __init__(self, dataset_path: Path) -> None:
        self._dataset_path = Path(dataset_path)
        self._dataset: SchemeDataset | None = None

    @property
    def path(self) -> Path:
        return self._dataset_path

    def _load(self) -> SchemeDataset:
        if self._dataset is not None:
            return self._dataset

        try:
            payload = json.loads(self._dataset_path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            logger.warning("Scheme dataset missing at %s", self._dataset_path)
            raise DatasetUnavailableError("Curated dataset file is missing.") from exc
        except (OSError, json.JSONDecodeError) as exc:
            logger.exception("Scheme dataset could not be read or parsed")
            raise DatasetUnavailableError(
                "Curated dataset file could not be parsed."
            ) from exc

        try:
            dataset = SchemeDataset.model_validate(payload)
        except ValidationError as exc:
            # Validation messages name fields, never user data: the dataset is
            # repository-owned content, not a request body.
            logger.error("Scheme dataset failed validation: %s", exc)
            raise DatasetUnavailableError("Curated dataset failed validation.") from exc

        self._dataset = dataset
        logger.info(
            "Loaded %s curated schemes (dataset updated %s)",
            len(dataset.schemes),
            dataset.updated_at.isoformat(),
        )
        return dataset

    def get_dataset(self) -> SchemeDataset:
        """Return the validated dataset or raise DatasetUnavailableError."""
        return self._load()

    def status(self) -> DatasetStatus:
        """Validate the dataset and report its record count."""
        try:
            dataset = self._load()
        except DatasetUnavailableError as exc:
            return DatasetStatus(
                path=str(self._dataset_path),
                scheme_count=0,
                available=False,
                detail=str(exc),
            )

        count = len(dataset.schemes)
        return DatasetStatus(
            path=str(self._dataset_path),
            scheme_count=count,
            available=True,
            detail=(
                f"{count} curated schemes loaded."
                if count
                else "0 schemes loaded in the curated dataset."
            ),
        )

    def get_scheme(self, scheme_id: str) -> Scheme | None:
        """Return a single scheme by its stable catalogue id."""
        dataset = self._load()
        return next(
            (scheme for scheme in dataset.schemes if scheme.id == scheme_id),
            None,
        )

    def query(
        self,
        *,
        query: str | None = None,
        category: SchemeCategory | None = None,
        government_level: GovernmentLevel | None = None,
        page: int = 1,
        page_size: int = 12,
    ) -> tuple[list[Scheme], int]:
        """Return one page of matching schemes plus the unpaged total.

        Search covers the localised names, summaries, departments, stable id
        and curated keywords. Filters are applied before pagination so the
        returned total describes the whole result set.
        """
        dataset = self._load()
        schemes = dataset.schemes

        if category is not None:
            schemes = [s for s in schemes if s.category == category]

        if government_level is not None:
            schemes = [s for s in schemes if s.government_level == government_level]

        needle = _search_key(query.strip()) if query and query.strip() else ""
        if needle:
            schemes = [scheme for scheme in schemes if needle in _haystack(scheme)]

        total = len(schemes)
        start = (page - 1) * page_size
        return schemes[start : start + page_size], total
