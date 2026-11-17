"""API tests for the foundation and Day 2 live features."""

from fastapi.testclient import TestClient


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


def test_system_info_exposes_trilingual_support(client: TestClient) -> None:
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200

    body = response.json()
    language_codes = {language["code"] for language in body["languages"]}
    assert language_codes == {"en", "ml", "hi"}

    features = {feature["id"]: feature for feature in body["features"]}
    assert features["scheme-discovery"]["status"] == "live"
    assert features["eligibility"]["status"] == "live"
    assert features["document-intelligence"]["status"] != "live"


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
