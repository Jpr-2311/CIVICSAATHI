"""Production deployment configuration guards.

These tests cover the environment contract that Render relies on: explicit
CORS, absolute persistent storage in production and cwd-independent local paths.
No network calls, credentials or real persistent disks are used.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from pydantic import ValidationError
from starlette.middleware.cors import CORSMiddleware

from app.core.config import BACKEND_DIR, Settings
from app.database.document_store import DocumentStore, DocumentStoreError
from app.main import app

ENVIRONMENT_KEYS = (
    "ENVIRONMENT",
    "CORS_ORIGINS",
    "PERSISTENT_DATA_DIR",
    "CHROMA_PERSIST_DIR",
    "DOCUMENT_STORAGE_DIR",
)


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch) -> None:
    for key in ENVIRONMENT_KEYS:
        monkeypatch.delenv(key, raising=False)


def prod_settings(tmp_path: Path, **overrides) -> Settings:
    return Settings(
        environment="production",
        cors_origins="https://app.example.com",
        persistent_data_dir=tmp_path / "disk",
        _env_file=None,
        **overrides,
    )


def test_production_derives_both_storage_paths_from_persistent_root(tmp_path) -> None:
    settings = prod_settings(tmp_path)

    root = (tmp_path / "disk").resolve()
    assert settings.chroma_persist_dir == root / "chroma"
    assert settings.document_storage_dir == root / "documents"
    assert settings.allowed_origins == ["https://app.example.com"]


def test_persistent_root_honors_explicit_absolute_override(tmp_path) -> None:
    custom_chroma = tmp_path / "custom-chroma"
    settings = prod_settings(tmp_path, chroma_persist_dir=custom_chroma)

    assert settings.chroma_persist_dir == custom_chroma.resolve()
    assert settings.document_storage_dir == (tmp_path / "disk").resolve() / "documents"


def test_production_accepts_explicit_storage_paths_without_root(tmp_path) -> None:
    settings = Settings(
        environment="production",
        cors_origins="https://app.example.com",
        chroma_persist_dir=tmp_path / "chroma",
        document_storage_dir=tmp_path / "documents",
        _env_file=None,
    )

    assert settings.chroma_persist_dir == (tmp_path / "chroma").resolve()
    assert settings.document_storage_dir == (tmp_path / "documents").resolve()


def test_production_requires_explicit_persistent_storage(tmp_path) -> None:
    with pytest.raises(ValidationError, match="PERSISTENT_DATA_DIR"):
        Settings(
            environment="production",
            cors_origins="https://app.example.com",
            _env_file=None,
        )


def test_production_rejects_relative_persistent_root() -> None:
    with pytest.raises(ValidationError, match="PERSISTENT_DATA_DIR must be absolute"):
        Settings(
            environment="production",
            cors_origins="https://app.example.com",
            persistent_data_dir=Path("relative-data"),
            _env_file=None,
        )


def test_production_rejects_relative_explicit_storage_path(tmp_path) -> None:
    with pytest.raises(ValidationError, match="CHROMA_PERSIST_DIR must be absolute"):
        Settings(
            environment="production",
            cors_origins="https://app.example.com",
            chroma_persist_dir=Path("relative-chroma"),
            document_storage_dir=tmp_path / "documents",
            _env_file=None,
        )


def test_wildcard_cors_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Wildcard CORS origins"):
        Settings(cors_origins="*", _env_file=None)


def test_malformed_cors_origin_is_rejected() -> None:
    with pytest.raises(ValidationError, match="Invalid CORS origin"):
        Settings(cors_origins="app.example.com", _env_file=None)


def test_production_requires_https_cors_origins(tmp_path) -> None:
    with pytest.raises(ValidationError, match="Production CORS origins must use HTTPS"):
        Settings(
            environment="production",
            cors_origins="http://app.example.com",
            persistent_data_dir=tmp_path / "disk",
            _env_file=None,
        )


def test_local_relative_paths_resolve_against_backend_not_cwd(
    monkeypatch, tmp_path
) -> None:
    monkeypatch.chdir(tmp_path)
    settings = Settings(
        environment="development",
        chroma_persist_dir=Path("relative-chroma"),
        document_storage_dir=Path("relative-documents"),
        _env_file=None,
    )

    assert settings.chroma_persist_dir == (BACKEND_DIR / "relative-chroma").resolve()
    assert (
        settings.document_storage_dir == (BACKEND_DIR / "relative-documents").resolve()
    )


def test_cors_middleware_uses_explicit_methods_and_headers() -> None:
    cors = next(
        middleware
        for middleware in app.user_middleware
        if middleware.cls is CORSMiddleware
    )

    assert cors.kwargs["allow_credentials"] is False
    assert set(cors.kwargs["allow_headers"]) == {"Accept", "Content-Type"}
    assert set(cors.kwargs["allow_methods"]) == {"GET", "POST", "DELETE", "OPTIONS"}
    assert "*" not in cors.kwargs["allow_origins"]


def test_document_store_fails_when_storage_directory_is_unavailable(tmp_path) -> None:
    blocked = tmp_path / "not-a-directory"
    blocked.write_text("occupied", encoding="utf-8")

    with pytest.raises(DocumentStoreError, match="unavailable"):
        DocumentStore(
            storage_dir=blocked / "documents",
            chroma_dir=tmp_path / "chroma",
            collection_name="deployment_config_test",
        )
