"""Minimal, readable logging setup for local development and Render."""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    """Configure process-wide logging once, at startup."""
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )
    # Keep noisy third-party access logs at a predictable level.
    logging.getLogger("uvicorn.access").setLevel(numeric_level)
