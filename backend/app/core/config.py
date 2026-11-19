"""Typed application settings loaded from environment variables.

Secrets only ever live on the server. The frontend receives public
status metadata, never API keys.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


def _resolve_config_path(path: Path) -> Path:
    """Resolve config paths against the backend directory, not the process cwd."""
    expanded = Path(path).expanduser()
    if expanded.is_absolute():
        return expanded.resolve()
    return (BACKEND_DIR / expanded).resolve()


class Settings(BaseSettings):
    """Runtime configuration for the CIVICSAATHI API."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "CIVICSAATHI AI"
    app_tagline: str = "Making government information accessible to everyone."
    app_version: str = "0.2.0"
    environment: Literal["development", "staging", "production"] = "development"
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"

    # Browser access. Comma-separated list of allowed origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Curated scheme dataset (Day 1 ships an empty, valid dataset).
    scheme_dataset_path: Path = (
        PROJECT_ROOT / "data" / "sample_schemes" / "schemes.json"
    )

    # Planned integrations. Presence is reported by /health/readiness.
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    supabase_url: str | None = None
    supabase_service_role_key: SecretStr | None = None

    # Absolute root of a mounted persistent disk in production. When set,
    # storage subdirectories are derived here unless explicitly overridden.
    persistent_data_dir: Path | None = None
    chroma_persist_dir: Path = Path(".chroma")

    # Document intelligence (Day 3). All paths are resolved on the server.
    document_storage_dir: Path = Path("data") / "documents"
    document_collection_name: str = "civicsaathi_government_documents"
    document_max_upload_bytes: int = 10 * 1024 * 1024
    document_max_pages: int = 100
    document_chunk_chars: int = 1200
    document_chunk_overlap_chars: int = 200
    document_min_chunk_chars: int = 40
    document_ocr_min_page_chars: int = 80
    document_search_top_k: int = 5
    document_search_max_top_k: int = 20
    document_search_max_distance: float = 1.0
    embedding_model_name: str = "intfloat/multilingual-e5-small"

    # Evidence-grounded assistant (Day 4). Retrieval defaults stay bounded;
    # the similarity gate is a documented heuristic, not a calibrated score.
    assistant_top_k: int = 5
    assistant_min_similarity: float = 0.30
    assistant_max_evidence_chunks: int = 5
    assistant_max_context_chars: int = 12000
    assistant_request_timeout_seconds: float = 30.0
    assistant_max_output_tokens: int = 900

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        """Require explicit, well-formed browser origins; never allow wildcards."""
        origins = [origin.strip().rstrip("/") for origin in value.split(",")]
        origins = [origin for origin in origins if origin]
        if not origins:
            raise ValueError("CORS_ORIGINS must contain at least one origin.")

        for origin in origins:
            if "*" in origin:
                raise ValueError("Wildcard CORS origins are not allowed.")
            parsed = urlparse(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(f"Invalid CORS origin: {origin}")

        return ",".join(origins)

    @model_validator(mode="after")
    def apply_deployment_policy(self) -> "Settings":
        """Resolve storage paths and enforce production deployment guards."""
        configured = set(self.model_fields_set)
        original_chroma_dir = self.chroma_persist_dir
        original_document_dir = self.document_storage_dir
        persistent_root = (
            _resolve_config_path(self.persistent_data_dir)
            if self.persistent_data_dir is not None
            else None
        )

        if persistent_root is not None:
            if "chroma_persist_dir" not in configured:
                self.chroma_persist_dir = persistent_root / "chroma"
            if "document_storage_dir" not in configured:
                self.document_storage_dir = persistent_root / "documents"

        self.chroma_persist_dir = _resolve_config_path(self.chroma_persist_dir)
        self.document_storage_dir = _resolve_config_path(self.document_storage_dir)

        if self.environment != "production":
            return self

        origins = self.allowed_origins
        if any(not origin.startswith("https://") for origin in origins):
            raise ValueError("Production CORS origins must use HTTPS.")

        explicit_storage = (
            persistent_root is not None
            or {
                "chroma_persist_dir",
                "document_storage_dir",
            }
            <= configured
        )
        if not explicit_storage:
            raise ValueError(
                "Production requires PERSISTENT_DATA_DIR or explicit absolute "
                "CHROMA_PERSIST_DIR and DOCUMENT_STORAGE_DIR."
            )

        if (
            self.persistent_data_dir is not None
            and not Path(self.persistent_data_dir).expanduser().is_absolute()
        ):
            raise ValueError("PERSISTENT_DATA_DIR must be absolute in production.")
        if (
            "chroma_persist_dir" in configured
            and not Path(original_chroma_dir).expanduser().is_absolute()
        ):
            raise ValueError("CHROMA_PERSIST_DIR must be absolute in production.")
        if (
            "document_storage_dir" in configured
            and not Path(original_document_dir).expanduser().is_absolute()
        ):
            raise ValueError("DOCUMENT_STORAGE_DIR must be absolute in production.")

        return self

    @property
    def allowed_origins(self) -> list[str]:
        """Return normalized CORS origins."""
        return [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key.get_secret_value())

    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_service_role_key
            and self.supabase_service_role_key.get_secret_value()
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the process lifetime."""
    return Settings()
