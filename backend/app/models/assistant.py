"""Pydantic contracts for the Day 4 evidence-grounded assistant API.

Citations are assembled by the backend from retrieved Day 3 passages. The model
only returns evidence ids; it never supplies document metadata. These models are
the public contract and never expose storage paths, keys or internal prompts.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

AssistantLanguage = Literal["en", "ml", "hi"]

ASSISTANT_DISCLAIMER = (
    "CIVICSAATHI AI is a hackathon prototype. Answers are generated only from "
    "the documents you uploaded, are not official advice, and do not determine "
    "eligibility. Verify every detail on the official source."
)

ASSISTANT_SIMILARITY_NOTICE = (
    "Passages are selected by embedding similarity, not by verified truth. "
    "Check the cited page of the official document before acting on an answer."
)


class AssistantAskRequest(BaseModel):
    """A grounded question. No system prompt is accepted from the client."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=1, max_length=1000)
    language: AssistantLanguage = "en"
    document_id: str | None = Field(
        default=None,
        max_length=64,
        pattern=r"^[A-Za-z0-9_-]+$",
        description="Optional server-generated document id to restrict evidence.",
    )

    @field_validator("question")
    @classmethod
    def _question_must_have_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Question must contain text.")
        return stripped

    @field_validator("document_id")
    @classmethod
    def _strip_document_id(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class AssistantCitation(BaseModel):
    """A citation whose metadata always comes from the retrieved passage."""

    evidence_id: str
    document_id: str
    document_title: str
    page: int = Field(ge=1)
    excerpt: str


class AssistantAskResponse(BaseModel):
    answer: str
    language: AssistantLanguage
    evidence_found: bool
    insufficient_evidence: bool
    citations: list[AssistantCitation] = Field(default_factory=list)
    message: str
    disclaimer: str = ASSISTANT_DISCLAIMER
    similarity_notice: str = ASSISTANT_SIMILARITY_NOTICE
