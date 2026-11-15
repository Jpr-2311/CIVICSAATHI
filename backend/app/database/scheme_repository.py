"""Read-only access to the curated government scheme dataset.

Why JSON on Day 1 instead of Supabase immediately:
- the API and UI can be built and tested without external credentials;
- the demo stays reproducible if a network or database is unavailable;
- the repository boundary means Day 2 can add a Supabase implementation
  without changing routes or response models.

Only curated records from official sources belong in this dataset. An
empty dataset is deliberately reported as "pending", never filled with
invented schemes.
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DatasetStatus:
    """Health snapshot of the curated scheme dataset."""

    path: str
    scheme_count: int
    available: bool
    detail: str


class SchemeRepository:
    """Read-only JSON-backed scheme repository."""

    def __init__(self, dataset_path: Path) -> None:
        self._dataset_path = dataset_path

    @property
    def path(self) -> Path:
        return self._dataset_path

    def status(self) -> DatasetStatus:
        """Validate the dataset file and report its record count."""
        if not self._dataset_path.exists():
            logger.warning("Scheme dataset missing at %s", self._dataset_path)
            return DatasetStatus(
                path=str(self._dataset_path),
                scheme_count=0,
                available=False,
                detail="Curated dataset file is missing.",
            )

        try:
            payload = json.loads(self._dataset_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            logger.exception("Scheme dataset could not be read or parsed")
            return DatasetStatus(
                path=str(self._dataset_path),
                scheme_count=0,
                available=False,
                detail="Curated dataset file could not be parsed.",
            )

        records = payload.get("schemes") if isinstance(payload, dict) else payload
        if not isinstance(records, list):
            logger.error("Scheme dataset has an unexpected shape")
            return DatasetStatus(
                path=str(self._dataset_path),
                scheme_count=0,
                available=False,
                detail="Curated dataset has an unexpected shape.",
            )

        count = len(records)
        detail = (
            f"{count} curated schemes loaded."
            if count
            else "0 schemes loaded — curated import scheduled for Day 2."
        )
        return DatasetStatus(
            path=str(self._dataset_path),
            scheme_count=count,
            available=True,
            detail=detail,
        )
