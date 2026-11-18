"""Eligibility engine and endpoint tests.

These tests pin the promises made in the API contract:

- results are deterministic and rule-based, never model-generated;
- a missing value is ``unknown`` and never silently treated as a pass;
- an official condition that cannot be encoded yields ``manual_review``,
  never a premature ``potentially_eligible``;
- the submitted profile is not persisted or echoed back.
"""

from __future__ import annotations

from datetime import date, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings

OUTCOMES = {
    "potentially_eligible",
    "ineligible",
    "insufficient_information",
    "manual_review",
}
OUTCOME_RANK = {
    "potentially_eligible": 0,
    "manual_review": 1,
    "insufficient_information": 2,
    "ineligible": 3,
}


def check(client: TestClient, **profile) -> dict:
    response = client.post("/api/v1/eligibility/check", json=profile)
    assert response.status_code == 200, response.text
    return response.json()


def result_for(body: dict, scheme_id: str) -> dict:
    return next(
        result for result in body["results"] if result["scheme_id"] == scheme_id
    )


def condition_statuses(result: dict) -> dict[str, str]:
    return {condition["id"]: condition["status"] for condition in result["conditions"]}


def test_empty_profile_returns_an_honest_result_for_every_scheme(
    client: TestClient,
) -> None:
    body = check(client)

    assert body["profile_fields_received"] == []
    assert len(body["results"]) == 15
    assert {result["outcome"] for result in body["results"]} <= OUTCOMES
    assert "potentially_eligible" not in {
        result["outcome"] for result in body["results"]
    }
    assert body["disclaimer"]
    assert "Final eligibility" in body["disclaimer"]

    checked_at = datetime.fromisoformat(body["checked_at"])
    assert checked_at.tzinfo is not None


def test_pm_jay_age_70_route_is_potentially_eligible(client: TestClient) -> None:
    body = check(client, age=72, indian_citizen=True)
    result = result_for(body, "pm-jay")

    assert result["outcome"] == "potentially_eligible"
    assert "not an official eligibility decision" in result["outcome_message"]
    assert result["outcome_message"].startswith("You meet every encoded condition")
    assert result["disclaimer"]
    assert condition_statuses(result)["age_70_or_above"] == "pass"
    assert condition_statuses(result)["indian_citizen"] == "pass"


def test_pm_jay_age_70_boundary_is_inclusive(client: TestClient) -> None:
    assert result_for(check(client, age=70, indian_citizen=True), "pm-jay")[
        "outcome"
    ] == ("potentially_eligible")
    assert result_for(check(client, age=69, indian_citizen=True), "pm-jay")[
        "outcome"
    ] == ("manual_review")


def test_pm_jay_requires_indian_citizenship(client: TestClient) -> None:
    non_citizen = result_for(check(client, age=72, indian_citizen=False), "pm-jay")
    assert non_citizen["outcome"] == "ineligible"
    assert condition_statuses(non_citizen)["indian_citizen"] == "fail"

    non_citizen_below_70 = result_for(
        check(client, age=69, indian_citizen=False), "pm-jay"
    )
    assert non_citizen_below_70["outcome"] == "ineligible"


def test_pm_jay_below_70_needs_the_manual_secc_route(
    client: TestClient,
) -> None:
    result = result_for(check(client, age=69, indian_citizen=True), "pm-jay")

    assert result["outcome"] == "manual_review"
    secc = next(
        condition
        for condition in result["conditions"]
        if condition["id"] == "manual_pmjay_secc"
    )
    assert secc["status"] == "unknown"
    assert secc["reason"] == "manual_verification_required"
    assert secc["message"].endswith("needs manual verification.")


def test_pm_kisan_complete_match_is_potentially_eligible(
    client: TestClient,
) -> None:
    result = result_for(
        check(
            client,
            landholding=True,
            institutional_landholder=False,
            income_tax_payer=False,
            government_employee=False,
            excluded_government_job=False,
            constitutional_post_holder=False,
            registered_professional=False,
            monthly_pension=0,
        ),
        "pm-kisan",
    )

    assert result["outcome"] == "potentially_eligible"
    assert set(condition_statuses(result).values()) == {"pass"}
    assert len(result["groups"]) == 1
    assert result["groups"][0]["status"] == "satisfied"


def test_pm_kisan_pension_boundary(client: TestClient) -> None:
    base = {
        "landholding": True,
        "institutional_landholder": False,
        "income_tax_payer": False,
        "government_employee": False,
        "excluded_government_job": False,
        "constitutional_post_holder": False,
        "registered_professional": False,
    }

    below_limit = result_for(check(client, **base, monthly_pension=9_999), "pm-kisan")
    at_limit = result_for(check(client, **base, monthly_pension=10_000), "pm-kisan")
    above_limit = result_for(check(client, **base, monthly_pension=10_001), "pm-kisan")

    assert below_limit["outcome"] == "potentially_eligible"
    assert at_limit["outcome"] == "ineligible"
    assert above_limit["outcome"] == "ineligible"
    assert condition_statuses(at_limit)["monthly_pension_below_10000"] == "fail"
    assert condition_statuses(above_limit)["monthly_pension_below_10000"] == "fail"


@pytest.mark.parametrize(
    "overrides",
    [
        {"institutional_landholder": True},
        {"income_tax_payer": True},
        {"excluded_government_job": True},
        {"constitutional_post_holder": True},
        {"registered_professional": True},
    ],
)
def test_pm_kisan_exclusion_conditions_make_the_scheme_ineligible(
    client: TestClient, overrides: dict
) -> None:
    profile = {
        "landholding": True,
        "institutional_landholder": False,
        "income_tax_payer": False,
        "government_employee": False,
        "excluded_government_job": False,
        "constitutional_post_holder": False,
        "registered_professional": False,
        "monthly_pension": 0,
        **overrides,
    }
    assert result_for(check(client, **profile), "pm-kisan")["outcome"] == ("ineligible")


def test_missing_values_are_unknown_and_drive_insufficient_information(
    client: TestClient,
) -> None:
    result = result_for(check(client, landholding=True), "pm-kisan")

    assert result["outcome"] == "insufficient_information"
    statuses = condition_statuses(result)
    assert statuses["landholding_farmer"] == "pass"
    assert statuses["not_income_tax_payer"] == "unknown"

    unknown = next(
        condition
        for condition in result["conditions"]
        if condition["id"] == "not_income_tax_payer"
    )
    assert unknown["reason"] == "missing_profile_field"
    assert unknown["message"].endswith("information missing.")
    assert result["groups"][0]["status"] == "insufficient_information"


def test_apy_age_and_enrolment_boundaries(client: TestClient) -> None:
    base = {
        "indian_citizen": True,
        "bank_account": True,
        "ever_income_tax_payer": False,
        "duplicate_enrolment": False,
    }

    assert (
        result_for(check(client, **base, age=18), "atal-pension-yojana")["outcome"]
        == "potentially_eligible"
    )
    assert (
        result_for(check(client, **base, age=40), "atal-pension-yojana")["outcome"]
        == "potentially_eligible"
    )
    assert (
        result_for(check(client, **base, age=41), "atal-pension-yojana")["outcome"]
        == "ineligible"
    )
    assert (
        result_for(check(client, **base, age=17), "atal-pension-yojana")["outcome"]
        == "ineligible"
    )

    no_bank = result_for(
        check(client, age=30, indian_citizen=True), "atal-pension-yojana"
    )
    assert no_bank["outcome"] == "insufficient_information"

    tax_payer = result_for(
        check(
            client,
            **{**base, "ever_income_tax_payer": True},
            age=30,
        ),
        "atal-pension-yojana",
    )
    assert tax_payer["outcome"] == "ineligible"
    assert condition_statuses(tax_payer)["never_income_tax_payer"] == "fail"

    last_year_only = result_for(
        check(
            client,
            **base,
            age=30,
            income_tax_payer=True,
        ),
        "atal-pension-yojana",
    )
    assert last_year_only["outcome"] == "potentially_eligible"


@pytest.mark.parametrize(
    ("age", "expected"),
    [(18, "potentially_eligible"), (50, "potentially_eligible"), (51, "ineligible")],
)
def test_pmjjby_age_boundaries(client: TestClient, age: int, expected: str) -> None:
    result = result_for(
        check(
            client,
            age=age,
            bank_account=True,
            consent_auto_debit=True,
            duplicate_enrolment=False,
        ),
        "pmjjby",
    )
    assert result["outcome"] == expected


@pytest.mark.parametrize(
    ("age", "expected"),
    [(18, "potentially_eligible"), (70, "potentially_eligible"), (71, "ineligible")],
)
def test_pmsby_age_boundaries(client: TestClient, age: int, expected: str) -> None:
    result = result_for(
        check(
            client,
            age=age,
            bank_account=True,
            consent_auto_debit=True,
            duplicate_enrolment=False,
        ),
        "pmsby",
    )
    assert result["outcome"] == expected


def test_insurance_schemes_need_auto_debit_consent(client: TestClient) -> None:
    result = result_for(
        check(client, age=30, bank_account=True, duplicate_enrolment=False),
        "pmjjby",
    )
    assert result["outcome"] == "insufficient_information"
    assert condition_statuses(result)["auto_debit_consent"] == "unknown"


def test_ignoaps_age_and_bpl_conditions(client: TestClient) -> None:
    base = {"indian_citizen": True, "bpl": True}

    assert result_for(check(client, **base, age=60), "ignoaps")["outcome"] == (
        "potentially_eligible"
    )
    assert result_for(check(client, **base, age=59), "ignoaps")["outcome"] == (
        "ineligible"
    )
    assert (
        result_for(check(client, age=65, indian_citizen=True, bpl=False), "ignoaps")[
            "outcome"
        ]
        == "ineligible"
    )


def test_mgnrega_requires_rural_residence_and_willingness(
    client: TestClient,
) -> None:
    assert (
        result_for(
            check(client, area="rural", age=18, willing_manual_work=True),
            "mgnrega",
        )["outcome"]
        == "potentially_eligible"
    )

    assert (
        result_for(
            check(client, area="urban", age=18, willing_manual_work=True),
            "mgnrega",
        )["outcome"]
        == "ineligible"
    )

    assert (
        result_for(
            check(client, area="rural", age=18),
            "mgnrega",
        )["outcome"]
        == "insufficient_information"
    )


def test_snehapoorvam_bpl_and_apl_routes(client: TestClient) -> None:
    base = {"lost_parent": True, "education_level": "school_or_college"}

    assert (
        result_for(check(client, **base, bpl=True), "snehapoorvam")["outcome"]
        == "potentially_eligible"
    )
    assert (
        result_for(
            check(client, **base, bpl=False, area="rural", annual_income=19_999),
            "snehapoorvam",
        )["outcome"]
        == "potentially_eligible"
    )
    assert (
        result_for(
            check(client, **base, bpl=False, area="rural", annual_income=20_000),
            "snehapoorvam",
        )["outcome"]
        == "ineligible"
    )
    assert (
        result_for(
            check(client, **base, bpl=False, area="urban", annual_income=22_374),
            "snehapoorvam",
        )["outcome"]
        == "potentially_eligible"
    )
    assert (
        result_for(
            check(client, **base, bpl=False, area="urban", annual_income=22_375),
            "snehapoorvam",
        )["outcome"]
        == "ineligible"
    )


def test_snehapoorvam_covers_degree_and_professional_students(
    client: TestClient,
) -> None:
    profile = {
        "lost_parent": True,
        "education_level": "degree_or_professional",
        "bpl": True,
    }
    result = result_for(check(client, **profile), "snehapoorvam")
    assert result["outcome"] == "potentially_eligible"
    assert condition_statuses(result)["student_up_to_degree"] == "pass"


def test_snehapoorvam_has_three_alternative_routes(client: TestClient) -> None:
    result = result_for(check(client, lost_parent=True), "snehapoorvam")
    assert len(result["groups"]) == 3
    assert {group["status"] for group in result["groups"]} == {
        "insufficient_information"
    }


def test_snehapoorvam_education_level_is_mandatory(client: TestClient) -> None:
    result = result_for(
        check(
            client,
            lost_parent=True,
            education_level="completed_degree",
            bpl=True,
        ),
        "snehapoorvam",
    )
    assert result["outcome"] == "ineligible"
    assert condition_statuses(result)["student_up_to_degree"] == "fail"


def test_samaswasam_alternative_routes(client: TestClient) -> None:
    hemophilia = result_for(check(client, hemophilia_patient=True), "samaswasam")
    assert hemophilia["outcome"] == "potentially_eligible"
    assert len(hemophilia["groups"]) == 4

    dialysis = result_for(check(client, bpl=True, dialysis_patient=True), "samaswasam")
    assert dialysis["outcome"] == "potentially_eligible"

    transplant = result_for(
        check(
            client,
            transplant_patient=True,
            years_since_transplant=5,
            annual_income=99_999,
        ),
        "samaswasam",
    )
    assert transplant["outcome"] == "potentially_eligible"

    outside_window = result_for(
        check(
            client,
            transplant_patient=True,
            years_since_transplant=6,
            annual_income=99_999,
        ),
        "samaswasam",
    )
    assert condition_statuses(outside_window)["transplant_within_5_years"] == "fail"
    assert outside_window["outcome"] in {"ineligible", "insufficient_information"}
    assert outside_window["outcome"] != "potentially_eligible"

    ineligible = result_for(
        check(
            client,
            bpl=True,
            dialysis_patient=False,
            transplant_patient=False,
            hemophilia_patient=False,
            sickle_cell_patient=True,
            category="st",
            annual_income=100_000,
        ),
        "samaswasam",
    )
    assert ineligible["outcome"] == "ineligible"


@pytest.mark.parametrize(
    ("scheme_id", "profile"),
    [
        (
            "pm-svanidhi",
            {
                "street_vendor": True,
                "age": 30,
                "unique_upi_id": True,
                "loan_npa_or_written_off": False,
            },
        ),
        ("pmay-urban", {"area": "urban", "annual_income": 900_000}),
        ("kasp", {"state": "Kerala"}),
        ("vayomithram", {"state": "Kerala", "age": 70}),
        ("snehasanthwanam", {}),
    ],
)
def test_unencodable_official_condition_forces_manual_review(
    client: TestClient, scheme_id: str, profile: dict
) -> None:
    """A fully checked subset must never be reported as potentially eligible."""
    result = result_for(check(client, **profile), scheme_id)

    assert result["outcome"] == "manual_review"
    assert "manual verification" in result["outcome_message"]
    assert any(
        condition["status"] == "unknown"
        and condition["reason"] == "manual_verification_required"
        for condition in result["conditions"]
    )
    assert all(group["status"] != "satisfied" for group in result["groups"])


@pytest.mark.parametrize(
    ("scheme_id", "profile"),
    [
        (
            "pm-svanidhi",
            {
                "street_vendor": False,
                "age": 30,
                "unique_upi_id": True,
                "loan_npa_or_written_off": False,
            },
        ),
        ("pmay-urban", {"area": "rural"}),
        ("pmay-urban", {"area": "urban", "annual_income": 900_001}),
        ("kasp", {"state": "Tamil Nadu"}),
        ("vayomithram", {"state": "Kerala", "age": 60}),
    ],
)
def test_a_failed_condition_beats_manual_review(
    client: TestClient, scheme_id: str, profile: dict
) -> None:
    assert result_for(check(client, **profile), scheme_id)["outcome"] == ("ineligible")


def test_pm_svanidhi_profile_boundaries(client: TestClient) -> None:
    base = {
        "street_vendor": True,
        "unique_upi_id": True,
        "loan_npa_or_written_off": False,
    }

    at_18 = result_for(check(client, **base, age=18), "pm-svanidhi")
    assert at_18["outcome"] == "manual_review"
    assert condition_statuses(at_18)["age_18_or_above"] == "pass"

    below_18 = result_for(check(client, **base, age=17), "pm-svanidhi")
    assert below_18["outcome"] == "ineligible"
    assert condition_statuses(below_18)["age_18_or_above"] == "fail"

    no_upi = result_for(
        check(client, **{**base, "unique_upi_id": False}, age=30),
        "pm-svanidhi",
    )
    assert no_upi["outcome"] == "ineligible"
    assert condition_statuses(no_upi)["svanidhi_unique_upi_id"] == "fail"

    npa = result_for(
        check(client, **{**base, "loan_npa_or_written_off": True}, age=30),
        "pm-svanidhi",
    )
    assert npa["outcome"] == "ineligible"
    assert condition_statuses(npa)["no_loan_npa_or_written_off"] == "fail"


def test_pmay_urban_2_income_band_and_manual_conditions(client: TestClient) -> None:
    at_limit = result_for(
        check(client, area="urban", annual_income=900_000), "pmay-urban"
    )
    assert at_limit["outcome"] == "manual_review"
    statuses = condition_statuses(at_limit)
    assert statuses["annual_income_up_to_900000"] == "pass"
    assert statuses["manual_pmay_no_pucca_house"] == "unknown"
    assert statuses["manual_pmay_no_allotment_20_years"] == "unknown"
    assert statuses["manual_pmay_female_ownership"] == "unknown"
    assert statuses["manual_pmay_vertical"] == "unknown"

    above_limit = result_for(
        check(client, area="urban", annual_income=900_001), "pmay-urban"
    )
    assert above_limit["outcome"] == "ineligible"
    assert condition_statuses(above_limit)["annual_income_up_to_900000"] == "fail"


def test_results_are_ranked_by_outcome_then_name(client: TestClient) -> None:
    body = check(client, age=72, indian_citizen=True)
    ranks = [OUTCOME_RANK[result["outcome"]] for result in body["results"]]

    assert ranks == sorted(ranks)
    assert body["results"][0]["scheme_id"] == "pm-jay"


def test_provided_field_names_are_reported_without_values(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/eligibility/check",
        json={"age": 72, "state": "Kerala", "annual_income": 123_456},
    )
    assert response.status_code == 200
    body = response.json()

    assert set(body["profile_fields_received"]) == {
        "age",
        "state",
        "annual_income",
    }
    assert "123456" not in response.text
    assert "123,456" not in response.text


def test_extra_sensitive_fields_are_rejected_without_echo(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/eligibility/check",
        json={"age": 30, "aadhaar_number": "1234 5678 9012"},
    )
    assert response.status_code == 422
    assert "aadhaar_number" in response.text
    assert "1234 5678 9012" not in response.text


@pytest.mark.parametrize(
    "profile",
    [
        {"age": 121},
        {"age": -1},
        {"annual_income": -1},
        {"monthly_pension": -1},
        {"area": "coastal"},
        {"category": "other"},
        {"education_level": "phd"},
        {"language": "fr"},
    ],
)
def test_out_of_range_or_unknown_values_are_rejected(
    client: TestClient, profile: dict
) -> None:
    assert client.post("/api/v1/eligibility/check", json=profile).status_code == 422


def test_evaluation_does_not_modify_the_dataset(client: TestClient) -> None:
    path = Path(get_settings().scheme_dataset_path)
    before = path.read_bytes()
    before_mtime = path.stat().st_mtime_ns

    check(
        client,
        age=72,
        state="Kerala",
        annual_income=42_424,
        bpl=True,
        category="general",
    )

    assert path.read_bytes() == before
    assert path.stat().st_mtime_ns == before_mtime


def test_results_are_localised(client: TestClient) -> None:
    body = check(client, age=72, indian_citizen=True, language="ml")
    result = result_for(body, "pm-jay")

    assert body["language"] == "ml"
    assert result["scheme_name"].startswith("ആയുഷ്മാൻ")
    assert "ഔദ്യോഗിക" in result["outcome_message"]
    assert "അന്തിമ യോഗ്യത" in result["disclaimer"]
    assert result["conditions"][0]["label"]
    assert result["conditions"][0]["message"]


def test_eligibility_is_stable_across_repeated_requests(
    client: TestClient,
) -> None:
    first = check(client, age=72, state="Kerala")
    second = check(client, age=72, state="Kerala")

    assert [r["scheme_id"] for r in first["results"]] == [
        r["scheme_id"] for r in second["results"]
    ]
    assert [r["outcome"] for r in first["results"]] == [
        r["outcome"] for r in second["results"]
    ]


def test_source_verification_dates_are_not_in_the_future(
    client: TestClient,
) -> None:
    body = check(client, age=72)
    today = date.today()
    for result in body["results"]:
        assert date.fromisoformat(result["verified_on"]) <= today
        assert result["source"]["url"].startswith("https://")
