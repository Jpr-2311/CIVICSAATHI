"""Dataset integrity and repository tests.

The catalogue is a promised-verified artefact, so the tests check both the
actual curated file and the validation gates that keep an unverified or
malformed record from ever reaching the API.
"""

from __future__ import annotations

import copy
import json
from datetime import date
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import get_settings
from app.core.source_policy import ALLOWED_SOURCE_DOMAINS, validate_official_url
from app.database.scheme_repository import (
    DatasetUnavailableError,
    SchemeRepository,
)
from app.models.schemes import SchemeDataset

DATASET_PATH = get_settings().scheme_dataset_path


@pytest.fixture(scope="module")
def raw_dataset() -> dict:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def dataset(raw_dataset: dict) -> SchemeDataset:
    return SchemeDataset.model_validate(raw_dataset)


def _mutated(raw_dataset: dict) -> dict:
    return copy.deepcopy(raw_dataset)


def test_curated_file_exists() -> None:
    assert DATASET_PATH.is_file()
    assert DATASET_PATH.parent.name == "sample_schemes"


def test_dataset_validates(dataset: SchemeDataset) -> None:
    assert dataset.version >= 2
    assert dataset.note.strip()


def test_dataset_has_the_expected_coverage(dataset: SchemeDataset) -> None:
    assert len(dataset.schemes) == 15
    assert len(dataset.conditions) == 45

    central = [s for s in dataset.schemes if s.government_level == "central"]
    state = [s for s in dataset.schemes if s.government_level == "state"]
    assert len(central) == 10
    assert len(state) == 5
    assert {s.state.en for s in state if s.state} == {"Kerala"}


def test_scheme_ids_and_condition_keys_are_unique(dataset: SchemeDataset) -> None:
    assert len({scheme.id for scheme in dataset.schemes}) == len(dataset.schemes)
    for key, condition in dataset.conditions.items():
        assert key == condition.id


def test_every_condition_is_used_by_at_least_one_scheme(
    dataset: SchemeDataset,
) -> None:
    used = {
        condition_id
        for scheme in dataset.schemes
        for group in scheme.rule.any_of
        for condition_id in group.all_of
    }
    assert used == set(dataset.conditions)


def test_every_scheme_has_complete_localised_content(
    dataset: SchemeDataset,
) -> None:
    for scheme in dataset.schemes:
        records = [
            scheme.name,
            scheme.short_name,
            scheme.summary,
            scheme.description,
            scheme.department,
            *scheme.benefits,
            *scheme.documents_required,
            *scheme.application_steps,
        ]
        if scheme.state is not None:
            records.append(scheme.state)
        for record in records:
            assert record.en.strip()
            assert record.ml.strip()
            assert record.hi.strip()


def test_every_scheme_has_benefits_documents_and_steps(
    dataset: SchemeDataset,
) -> None:
    for scheme in dataset.schemes:
        assert scheme.benefits
        assert scheme.documents_required
        assert scheme.application_steps
        assert scheme.source.title.strip()
        assert scheme.source.publisher.strip()


def test_every_source_url_is_https_and_allowlisted(
    dataset: SchemeDataset,
) -> None:
    for scheme in dataset.schemes:
        for source in [scheme.source, *scheme.additional_sources]:
            assert source.url == validate_official_url(source.url)
            assert source.url.startswith("https://")
            host = source.url.split("/")[2].split(":")[0].lower()
            assert any(
                host == domain or host.endswith(f".{domain}")
                for domain in ALLOWED_SOURCE_DOMAINS
            )


def test_verification_dates_are_not_in_the_future(
    dataset: SchemeDataset,
) -> None:
    today = date.today()
    assert dataset.updated_at <= today
    for scheme in dataset.schemes:
        assert scheme.verified_on <= today
        assert scheme.source.verified_on == scheme.verified_on
        for source in scheme.additional_sources:
            assert source.verified_on <= today


def test_state_and_central_metadata_is_consistent(dataset: SchemeDataset) -> None:
    for scheme in dataset.schemes:
        if scheme.government_level == "central":
            assert scheme.state is None
        else:
            assert scheme.state is not None


def test_manual_conditions_are_labelled_and_have_no_profile_rule(
    dataset: SchemeDataset,
) -> None:
    manual = [
        condition
        for condition in dataset.conditions.values()
        if condition.kind == "manual"
    ]
    assert manual
    for condition in manual:
        assert condition.field is None
        assert condition.operator is None
        assert condition.value is None


def test_repository_loads_and_caches_the_validated_dataset() -> None:
    repository = SchemeRepository(DATASET_PATH)
    first = repository.get_dataset()
    second = repository.get_dataset()
    assert first is second
    assert len(first.schemes) == 15

    status = repository.status()
    assert status.available is True
    assert status.scheme_count == 15
    assert "15 curated schemes" in status.detail


def test_repository_finds_a_scheme_by_stable_id() -> None:
    repository = SchemeRepository(DATASET_PATH)
    scheme = repository.get_scheme("pm-jay")
    assert scheme is not None
    assert scheme.government_level == "central"
    assert repository.get_scheme("not-a-scheme") is None


def test_repository_search_filters_before_pagination() -> None:
    repository = SchemeRepository(DATASET_PATH)

    state_schemes, total = repository.query(government_level="state")
    assert total == 5
    assert len(state_schemes) == 5

    health_schemes, health_total = repository.query(category="health")
    assert health_total == 3
    assert {scheme.id for scheme in health_schemes} == {
        "pm-jay",
        "kasp",
        "samaswasam",
    }

    page, page_total = repository.query(page=2, page_size=4)
    assert page_total == 15
    assert len(page) == 4

    found, found_total = repository.query(query="  FARMER  ")
    assert found_total == 1
    assert found[0].id == "pm-kisan"

    malayalam, malayalam_total = repository.query(query="കർഷകൻ")
    assert malayalam_total == 1
    assert malayalam[0].id == "pm-kisan"

    hindi, hindi_total = repository.query(query="आयुष्मान")
    assert hindi_total == 1
    assert hindi[0].id == "pm-jay"


def test_repository_missing_file_is_unavailable(tmp_path: Path) -> None:
    repository = SchemeRepository(tmp_path / "missing.json")

    with pytest.raises(DatasetUnavailableError):
        repository.get_dataset()

    status = repository.status()
    assert status.available is False
    assert status.scheme_count == 0
    assert "missing" in status.detail.lower()


def test_repository_malformed_json_is_unavailable(tmp_path: Path) -> None:
    path = tmp_path / "schemes.json"
    path.write_text("{not json", encoding="utf-8")
    repository = SchemeRepository(path)

    with pytest.raises(DatasetUnavailableError):
        repository.get_dataset()

    assert repository.status().available is False


def test_repository_rejects_an_invalid_record(tmp_path: Path, raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["source"]["url"] = "https://example.com/fake"
    path = tmp_path / "schemes.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    repository = SchemeRepository(path)
    with pytest.raises(DatasetUnavailableError):
        repository.get_dataset()
    assert repository.status().available is False


def test_http_source_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["source"]["url"] = "http://pmkisan.gov.in/"
    with pytest.raises(ValidationError, match="HTTPS"):
        SchemeDataset.model_validate(payload)


def test_unlisted_source_host_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["source"]["url"] = "https://example.gov.in/"
    with pytest.raises(ValidationError, match="allowlist"):
        SchemeDataset.model_validate(payload)


def test_central_scheme_cannot_declare_a_state(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["state"] = {
        "en": "Kerala",
        "ml": "കേരളം",
        "hi": "केरल",
    }
    with pytest.raises(ValidationError, match="Central schemes"):
        SchemeDataset.model_validate(payload)


def test_state_scheme_must_declare_a_state(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    kasp = next(
        scheme for scheme in payload["schemes"] if scheme["id"] == "kasp"
    )
    kasp["state"] = None
    with pytest.raises(ValidationError, match="State schemes"):
        SchemeDataset.model_validate(payload)


def test_scheme_and_source_verification_dates_must_match(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["verified_on"] = "2025-01-01"
    with pytest.raises(ValidationError, match="verification dates"):
        SchemeDataset.model_validate(payload)


def test_missing_translation_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    del payload["schemes"][0]["name"]["hi"]
    with pytest.raises(ValidationError):
        SchemeDataset.model_validate(payload)


def test_manual_condition_cannot_carry_an_operator(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["conditions"]["manual_kasp_list"]["operator"] = "truthy"
    with pytest.raises(ValidationError, match="Manual conditions"):
        SchemeDataset.model_validate(payload)


def test_unknown_profile_field_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["conditions"]["bpl_household"]["field"] = "aadhaar_number"
    with pytest.raises(ValidationError, match="Unknown profile field"):
        SchemeDataset.model_validate(payload)


def test_operator_value_type_is_validated(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["conditions"]["age_18_or_above"]["value"] = "eighteen"
    with pytest.raises(ValidationError, match="integer"):
        SchemeDataset.model_validate(payload)


def test_duplicate_scheme_id_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"].append(copy.deepcopy(payload["schemes"][0]))
    with pytest.raises(ValidationError, match="unique"):
        SchemeDataset.model_validate(payload)


def test_condition_key_must_match_its_id(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["conditions"]["renamed_condition"] = payload["conditions"].pop(
        "bpl_household"
    )
    with pytest.raises(ValidationError, match="does not match its id"):
        SchemeDataset.model_validate(payload)


def test_rule_cannot_reference_an_unknown_condition(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["rule"]["any_of"][0]["all_of"].append("ghost_condition")
    with pytest.raises(ValidationError, match="unknown condition"):
        SchemeDataset.model_validate(payload)


def test_rule_group_cannot_repeat_a_condition(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    group = payload["schemes"][0]["rule"]["any_of"][0]["all_of"]
    group.append(group[0])
    with pytest.raises(ValidationError, match="repeat"):
        SchemeDataset.model_validate(payload)


def test_extra_scheme_field_is_rejected(raw_dataset: dict) -> None:
    payload = _mutated(raw_dataset)
    payload["schemes"][0]["official_guarantee"] = True
    with pytest.raises(ValidationError, match="Extra inputs"):
        SchemeDataset.model_validate(payload)
