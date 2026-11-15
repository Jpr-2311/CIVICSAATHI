"""API tests for the Day 1 foundation."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    # The context manager runs the lifespan hook, creating app.state.
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "civicsaathi-api"
    assert body["version"]
    assert body["uptime_seconds"] >= 0


def test_readiness_reports_all_dependencies(client: TestClient) -> None:
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200

    body = response.json()
    assert body["status"] in {"ready", "degraded", "not_ready"}
    assert body["checks"]

    check_ids = {check["id"] for check in body["checks"]}
    assert {
        "api",
        "scheme_dataset",
        "supabase",
        "gemini",
        "vector_store",
    } <= check_ids


def test_system_info_exposes_bilingual_support(client: TestClient) -> None:
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200

    body = response.json()
    language_codes = {language["code"] for language in body["languages"]}
    assert language_codes == {"en", "ml"}
    assert any(feature["status"] == "live" for feature in body["features"])


def test_cors_allows_the_vite_dev_origin(client: TestClient) -> None:
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unknown_route_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
