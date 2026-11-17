"""API tests for the curated scheme catalogue."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.database.scheme_repository import SchemeRepository
from app.main import app


def test_catalogue_returns_a_validated_page(client: TestClient) -> None:
    response = client.get("/api/v1/schemes")
    assert response.status_code == 200

    body = response.json()
    assert body["language"] == "en"
    assert body["total"] == 15
    assert body["page"] == 1
    assert body["page_size"] == 12
    assert body["total_pages"] == 2
    assert len(body["items"]) == 12
    assert body["message"] is None
    assert body["content_note"]
    assert "not an official government service" in body["disclaimer"]

    first = body["items"][0]
    assert first["id"] == "pm-kisan"
    assert first["name"].startswith("Pradhan Mantri Kisan")
    assert first["government_level"] == "central"
    assert first["state"] is None
    assert first["benefit_highlights"]
    assert first["verified_on"] == "2026-11-16"
    assert first["source"]["url"].startswith("https://")


def test_second_page_contains_the_remaining_schemes(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"page": 2})
    assert response.status_code == 200

    body = response.json()
    assert body["page"] == 2
    assert body["total"] == 15
    assert len(body["items"]) == 3
    assert body["total_pages"] == 2


@pytest.mark.parametrize(
    ("query", "expected_id"),
    [
        ("farmer", "pm-kisan"),
        ("FARMER", "pm-kisan"),
        ("കർഷകൻ", "pm-kisan"),
        ("किसान", "pm-kisan"),
        ("street vendor", "pm-svanidhi"),
        ("ayushman", "pm-jay"),
        ("mgnrega", "mgnrega"),
        ("snehapoorvam", "snehapoorvam"),
    ],
)
def test_search_matches_names_keywords_and_all_languages(
    client: TestClient, query: str, expected_id: str
) -> None:
    response = client.get("/api/v1/schemes", params={"q": query})
    assert response.status_code == 200

    body = response.json()
    assert expected_id in {item["id"] for item in body["items"]}


def test_search_strips_surrounding_space(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"q": "  pension  "})
    assert response.status_code == 200

    body = response.json()
    assert body["query"] == "pension"
    assert body["total"] >= 2


def test_empty_search_is_a_normal_explained_response(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"q": "zzzz-no-such-scheme"})
    assert response.status_code == 200

    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["total_pages"] == 0
    assert "No schemes matched" in body["message"]


def test_category_filter(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"category": "health"})
    assert response.status_code == 200

    body = response.json()
    assert body["category"] == "health"
    assert body["total"] == 3
    assert {item["id"] for item in body["items"]} == {
        "pm-jay",
        "kasp",
        "samaswasam",
    }


def test_government_level_filter(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"government_level": "state"})
    assert response.status_code == 200

    body = response.json()
    assert body["total"] == 5
    assert {item["government_level"] for item in body["items"]} == {"state"}
    assert {item["state"] for item in body["items"]} == {"Kerala"}


def test_filters_combine_and_empty_combination_is_explained(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/schemes",
        params={"category": "education", "government_level": "state"},
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == "snehapoorvam"

    empty = client.get(
        "/api/v1/schemes",
        params={"category": "education", "government_level": "central"},
    )
    assert empty.status_code == 200
    assert empty.json()["items"] == []
    assert empty.json()["message"]


def test_page_beyond_results_is_explained(client: TestClient) -> None:
    response = client.get("/api/v1/schemes", params={"page": 99})
    assert response.status_code == 200

    body = response.json()
    assert body["items"] == []
    assert body["total"] == 15
    assert body["page"] == 99
    assert "beyond the available results" in body["message"]


@pytest.mark.parametrize(
    "params",
    [
        {"page": 0},
        {"page_size": 0},
        {"page_size": 51},
        {"language": "fr"},
        {"category": "space"},
        {"government_level": "local"},
        {"q": "x" * 101},
    ],
)
def test_invalid_query_parameters_are_rejected(
    client: TestClient, params: dict
) -> None:
    response = client.get("/api/v1/schemes", params=params)
    assert response.status_code == 422


def test_scheme_detail_contains_the_full_verified_record(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/schemes/pm-kisan")
    assert response.status_code == 200

    body = response.json()
    assert body["id"] == "pm-kisan"
    assert body["category"] == "agriculture"
    assert body["government_level"] == "central"
    assert body["department"] == "Ministry of Agriculture and Farmers Welfare"
    assert body["benefits"]
    assert body["documents_required"]
    assert body["application_steps"]
    assert body["source"]["url"] == "https://pmkisan.gov.in/"
    assert len(body["additional_sources"]) == 1
    assert body["additional_sources"][0]["url"].startswith("https://pmkisan.gov.in/")
    assert body["verified_on"] == "2026-11-16"
    assert body["content_note"]
    assert body["disclaimer"]

    conditions = {condition["id"]: condition for condition in body["conditions"]}
    assert len(conditions) == 6
    assert conditions["landholding_farmer"]["manual"] is False
    assert all(not condition["manual"] for condition in body["conditions"])


def test_scheme_detail_marks_manual_conditions(client: TestClient) -> None:
    response = client.get("/api/v1/schemes/pm-jay")
    assert response.status_code == 200

    conditions = {
        condition["id"]: condition for condition in response.json()["conditions"]
    }
    assert conditions["age_70_or_above"]["manual"] is False
    assert conditions["manual_pmjay_secc"]["manual"] is True


@pytest.mark.parametrize("language", ["ml", "hi"])
def test_scheme_detail_is_localised(client: TestClient, language: str) -> None:
    english = client.get("/api/v1/schemes/kasp").json()
    localised = client.get("/api/v1/schemes/kasp", params={"language": language})
    assert localised.status_code == 200

    body = localised.json()
    assert body["name"]
    assert body["name"] != english["name"]
    assert body["summary"] != english["summary"]
    assert body["benefits"] != english["benefits"]


def test_unknown_scheme_id_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/schemes/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Scheme not found."}


def test_dataset_failure_returns_an_honest_503(tmp_path) -> None:
    with TestClient(app) as failing_client:
        original = app.state.scheme_repository
        try:
            app.state.scheme_repository = SchemeRepository(tmp_path / "missing.json")
            response = failing_client.get("/api/v1/schemes")
        finally:
            app.state.scheme_repository = original

    assert response.status_code == 503
    assert response.json()["code"] == "dataset_unavailable"
    assert "missing" in response.json()["detail"].lower()


def test_scheme_dataset_is_reported_in_readiness(client: TestClient) -> None:
    response = client.get("/api/v1/health/readiness")
    assert response.status_code == 200

    checks = {check["id"]: check for check in response.json()["checks"]}
    assert checks["scheme_dataset"]["status"] == "ok"
    assert "15 curated schemes" in checks["scheme_dataset"]["detail"]


def test_repository_path_matches_configuration() -> None:
    repository = SchemeRepository(get_settings().scheme_dataset_path)
    assert repository.path.name == "schemes.json"
    assert repository.status().scheme_count == 15
