"""Tests for the official source allowlist.

The policy exists because a blanket ``.gov.in`` suffix rule is both too
weak (any host could end with it) and too narrow (PFRDA and the Kerala
Social Security Mission use other domains). These tests pin the reviewed
allowlist behaviour, including the rejection cases that would allow an
untrusted or downgraded URL into the curated dataset.
"""

import pytest

from app.core.source_policy import (
    ALLOWED_SOURCE_DOMAINS,
    SourcePolicyError,
    validate_official_url,
)


def test_every_allowed_domain_has_a_verification_rationale() -> None:
    assert ALLOWED_SOURCE_DOMAINS
    for domain, rationale in ALLOWED_SOURCE_DOMAINS.items():
        assert domain == domain.lower()
        assert "." in domain
        assert rationale.strip()
        assert len(rationale) >= 40


@pytest.mark.parametrize(
    "url",
    [
        "https://pmkisan.gov.in/",
        "https://www.pfrda.org.in/schemes/atal-pension-yojana-apy",
        "https://socialsecuritymission.gov.in/snehapoorvam/",
        "https://pib.gov.in/PressReleasePage.aspx?PRID=2053883",
        "https://PMKISAN.GOV.IN/Documents/guidelines.pdf",
        "https://pmkisan.gov.in:443/",
    ],
)
def test_approved_official_urls_are_accepted(url: str) -> None:
    assert validate_official_url(url) == url.strip()


@pytest.mark.parametrize(
    "url",
    [
        "",
        "   ",
        "http://pmkisan.gov.in/",
        "ftp://pmkisan.gov.in/",
        "javascript:alert(1)",
        "https://pmkisan.gov.in:8443/",
        "https://user:secret@pmkisan.gov.in/",
        "https://evil.example.com/",
        "https://pmkisan.gov.in.evil.example/",
        "https://evilpmkisan.gov.in/",
        "https://notpmkisan.gov.in/",
        "https://gov.in/",
    ],
)
def test_untrusted_or_downgraded_urls_are_rejected(url: str) -> None:
    with pytest.raises(SourcePolicyError):
        validate_official_url(url)


def test_subdomains_of_an_allowed_domain_are_accepted() -> None:
    assert (
        validate_official_url("https://cdn.pmkisan.gov.in/notice.pdf")
        == "https://cdn.pmkisan.gov.in/notice.pdf"
    )


def test_host_is_compared_after_normalisation() -> None:
    assert (
        validate_official_url("https://PMKISAN.GOV.IN./") == "https://PMKISAN.GOV.IN./"
    )


def test_query_strings_and_fragments_are_preserved() -> None:
    url = "https://pib.gov.in/PressReleasePage.aspx?PRID=1738169#details"
    assert validate_official_url(url) == url


def test_non_string_input_is_rejected() -> None:
    with pytest.raises(SourcePolicyError):
        validate_official_url(None)  # type: ignore[arg-type]
