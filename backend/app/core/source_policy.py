"""Official source URL policy for the curated scheme dataset.

Why an explicit allowlist instead of a blanket ``.gov.in`` / ``.nic.in`` test:

- A suffix rule accepts any host that happens to end in those strings, even
  when the host is not controlled by the scheme-owning department.
- Legitimate official sources are not limited to those suffixes.  PFRDA uses
  ``pfrda.org.in`` and the Kerala Social Security Mission uses
  ``socialsecuritymission.gov.in``.
- An explicit, reviewed entry lets us record *why* each domain is trusted.

Every URL in the scheme dataset is HTTPS-only and must match one of the
domains below exactly or be a subdomain of it.  The list is deliberately
small and is reviewed whenever a scheme is added.
"""

from urllib.parse import urlsplit

# domain -> verification rationale
ALLOWED_SOURCE_DOMAINS: dict[str, str] = {
    "pmkisan.gov.in": (
        "PM-KISAN portal and operational guidelines, Department of "
        "Agriculture, Cooperation and Farmers Welfare."
    ),
    "pmvishwakarma.gov.in": (
        "PM Vishwakarma portal and scheme guidelines, Ministry of Micro, "
        "Small and Medium Enterprises."
    ),
    "pfrda.org.in": (
        "Pension Fund Regulatory and Development Authority, the statutory "
        "regulator that administers Atal Pension Yojana."
    ),
    "jansuraksha.gov.in": (
        "Jan Suraksha portal, Department of Financial Services, Ministry of "
        "Finance; hosts the PMJJBY, PMSBY and APY rule documents."
    ),
    "pmsvanidhi.mohua.gov.in": (
        "PM SVANidhi portal, Ministry of Housing and Urban Affairs."
    ),
    "nregaplus.nic.in": (
        "National Informatics Centre-hosted MGNREGA document library used by "
        "the Department of Rural Development."
    ),
    "nrega.dord.gov.in": (
        "MGNREGA programme site of the Department of Rural Development."
    ),
    "nsap.dord.gov.in": (
        "National Social Assistance Programme site of the Department of "
        "Rural Development."
    ),
    "pib.gov.in": (
        "Press Information Bureau, the Government of India's official press "
        "release channel; used where a scheme portal does not publish the "
        "eligibility detail in accessible HTML."
    ),
    "pmay-urban.gov.in": (
        "PMAY-U 2.0 operational guidelines, Ministry of Housing and Urban Affairs."
    ),
    "pmaymis.gov.in": (
        "Pradhan Mantri Awas Yojana (Urban) management information system, "
        "Ministry of Housing and Urban Affairs."
    ),
    "sha.kerala.gov.in": (
        "State Health Agency, Government of Kerala; administers KASP and "
        "Ayushman Bharat in Kerala."
    ),
    "socialsecuritymission.gov.in": (
        "Kerala Social Security Mission, Government of Kerala; administers "
        "Snehapoorvam, Samaswasam, Vayomithram and Snehasanthwanam."
    ),
}


class SourcePolicyError(ValueError):
    """Raised when a dataset URL is not an approved official source."""


def validate_official_url(value: str) -> str:
    """Return a normalised URL if it is an approved HTTPS official source.

    The function intentionally rejects credentials, non-standard ports and
    non-HTTPS schemes.  Query strings and fragments are allowed because
    several government pages identify a scheme through a query parameter.
    """

    if not isinstance(value, str) or not value.strip():
        raise SourcePolicyError("Source URL must be a non-empty string.")

    candidate = value.strip()

    try:
        parts = urlsplit(candidate)
    except ValueError as exc:  # malformed IPv6, bad port, etc.
        raise SourcePolicyError("Source URL is not a valid URL.") from exc

    if parts.scheme.lower() != "https":
        raise SourcePolicyError("Official source URLs must use HTTPS.")

    if parts.username or parts.password:
        raise SourcePolicyError("Source URLs must not contain credentials.")

    if parts.port not in (None, 443):
        raise SourcePolicyError("Official source URLs must use the default HTTPS port.")

    host = (parts.hostname or "").lower().rstrip(".")
    if not host:
        raise SourcePolicyError("Source URL must include a host name.")

    for domain in ALLOWED_SOURCE_DOMAINS:
        if host == domain or host.endswith(f".{domain}"):
            return candidate

    raise SourcePolicyError(
        f"Source host '{host}' is not on the official source allowlist."
    )
