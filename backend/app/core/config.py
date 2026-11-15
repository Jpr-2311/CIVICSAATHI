"""Typed application settings loaded from environment variables.

Secrets only ever live on the server. The frontend receives public
status metadata, never API keys.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent


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
    app_version: str = "0.1.0"
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
    chroma_persist_dir: Path = BACKEND_DIR / ".chroma"

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
