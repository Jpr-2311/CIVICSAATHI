"""API schemas.

These models are intentionally explicit: they are the contract the React
client is built against and the shapes FastAPI documents at /docs.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DependencyStatus = Literal["ok", "pending", "not_configured", "error"]
ReadinessStatus = Literal["ready", "degraded", "not_ready"]
FeatureStatus = Literal["live", "next", "planned"]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: str
    version: str
    environment: str
    timestamp: datetime
    uptime_seconds: float = Field(ge=0)


class ReadinessCheck(BaseModel):
    id: str
    label: str
    status: DependencyStatus
    detail: str


class ReadinessResponse(BaseModel):
    status: ReadinessStatus
    checked_at: datetime
    checks: list[ReadinessCheck]


class LanguageInfo(BaseModel):
    code: str
    label: str
    native_label: str


class FeatureInfo(BaseModel):
    id: str
    name: str
    status: FeatureStatus
    milestone: str
    description: str


class SystemInfoResponse(BaseModel):
    name: str
    tagline: str
    description: str
    version: str
    environment: str
    region: str
    api_prefix: str
    docs_url: str
    languages: list[LanguageInfo]
    features: list[FeatureInfo]
    disclaimer: str
