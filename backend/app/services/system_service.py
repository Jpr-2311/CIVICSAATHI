"""Application services.

Business logic lives here, not in route handlers. This keeps the HTTP
layer thin and makes the eligibility engine and RAG pipeline testable in
isolation in later milestones.
"""

from datetime import UTC, datetime

from app.core.config import Settings
from app.database.scheme_repository import SchemeRepository
from app.models.schemas import (
    FeatureInfo,
    HealthResponse,
    LanguageInfo,
    ReadinessCheck,
    ReadinessResponse,
    SystemInfoResponse,
)

DISCLAIMER = (
    "CIVICSAATHI AI is a hackathon prototype and is not an official "
    "Government of Kerala service. Always verify scheme details on the "
    "official portal linked in each record."
)

FEATURES: list[FeatureInfo] = [
    FeatureInfo(
        id="foundation",
        name="Platform foundation",
        status="live",
        milestone="Day 1",
        description=(
            "React workspace, design system, typed FastAPI contract and "
            "live dependency telemetry."
        ),
    ),
    FeatureInfo(
        id="scheme-discovery",
        name="Scheme discovery",
        status="next",
        milestone="Day 2",
        description=(
            "Searchable, categorised scheme records with benefits, "
            "documents, procedures and official source links."
        ),
    ),
    FeatureInfo(
        id="eligibility",
        name="Eligibility checker",
        status="next",
        milestone="Day 2",
        description=(
            "Deterministic, rule-by-rule eligibility evaluation with a "
            "human-readable explanation for every condition."
        ),
    ),
    FeatureInfo(
        id="document-intelligence",
        name="Document intelligence",
        status="planned",
        milestone="Day 3",
        description=(
            "PDF extraction, semantic chunking, embeddings and ChromaDB "
            "retrieval with page-level metadata preserved."
        ),
    ),
    FeatureInfo(
        id="assistant",
        name="Multilingual assistant",
        status="planned",
        milestone="Day 4",
        description=(
            "Gemini-powered answers grounded in retrieved evidence, in "
            "English and Malayalam, with an honest 'not found' state."
        ),
    ),
    FeatureInfo(
        id="evidence",
        name="Evidence & citations",
        status="planned",
        milestone="Day 4",
        description=(
            "Every answer carries its document name, page number and "
            "supporting excerpt so citizens can verify the source."
        ),
    ),
]

LANGUAGES: list[LanguageInfo] = [
    LanguageInfo(code="en", label="English", native_label="English"),
    LanguageInfo(code="ml", label="Malayalam", native_label="മലയാളം"),
]


def build_health(settings: Settings, started_at: datetime) -> HealthResponse:
    """Build a liveness payload. Must never depend on external services."""
    now = datetime.now(UTC)
    return HealthResponse(
        service="civicsaathi-api",
        version=settings.app_version,
        environment=settings.environment,
        timestamp=now,
        uptime_seconds=round(max((now - started_at).total_seconds(), 0), 2),
    )


def _dataset_check(repository: SchemeRepository) -> ReadinessCheck:
    dataset = repository.status()
    if not dataset.available:
        status = "error"
    elif dataset.scheme_count == 0:
        status = "pending"
    else:
        status = "ok"
    return ReadinessCheck(
        id="scheme_dataset",
        label="Curated scheme dataset",
        status=status,
        detail=dataset.detail,
    )


def _credential_check(
    *,
    check_id: str,
    label: str,
    configured: bool,
    pending_detail: str,
    missing_detail: str,
) -> ReadinessCheck:
    return ReadinessCheck(
        id=check_id,
        label=label,
        status="pending" if configured else "not_configured",
        detail=pending_detail if configured else missing_detail,
    )


def build_readiness(settings: Settings, repository: SchemeRepository) -> ReadinessResponse:
    """Report which dependencies are available and which are planned."""
    checks = [
        ReadinessCheck(
            id="api",
            label="API runtime",
            status="ok",
            detail="FastAPI is responding.",
        ),
        _dataset_check(repository),
        _credential_check(
            check_id="supabase",
            label="Supabase PostgreSQL",
            configured=settings.supabase_configured,
            pending_detail="Credentials detected — integration scheduled for Day 2.",
            missing_detail="Credentials not set. Using the local JSON provider.",
        ),
        _credential_check(
            check_id="gemini",
            label="Google Gemini",
            configured=settings.gemini_configured,
            pending_detail="Credentials detected — RAG pipeline scheduled for Day 4.",
            missing_detail="GEMINI_API_KEY is not set. AI features are disabled.",
        ),
        ReadinessCheck(
            id="vector_store",
            label="ChromaDB vector store",
            status="pending",
            detail="Provisioned with document ingestion on Day 3.",
        ),
    ]

    states = {check.status for check in checks}
    if "error" in states:
        readiness_status = "not_ready"
    elif states == {"ok"}:
        readiness_status = "ready"
    else:
        readiness_status = "degraded"

    return ReadinessResponse(
        status=readiness_status,
        checked_at=datetime.now(UTC),
        checks=checks,
    )


def build_system_info(settings: Settings) -> SystemInfoResponse:
    return SystemInfoResponse(
        name=settings.app_name,
        tagline=settings.app_tagline,
        description=(
            "A multilingual civic intelligence assistant for discovering "
            "government schemes, checking eligibility and reading official "
            "documents with verifiable citations."
        ),
        version=settings.app_version,
        environment=settings.environment,
        region="Kerala, India",
        api_prefix=settings.api_prefix,
        docs_url="/docs",
        languages=LANGUAGES,
        features=FEATURES,
        disclaimer=DISCLAIMER,
    )
