"""Scheme catalogue and eligibility contracts.

The dataset models are validated at load time, not at request time.  A
malformed record therefore fails loudly in the repository layer instead of
producing a half-verified API response.  The response models are the public
contract the React client is built against.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core.source_policy import SourcePolicyError, validate_official_url

LanguageCode = Literal["en", "ml", "hi"]
SchemeCategory = Literal[
    "agriculture",
    "business",
    "education",
    "employment",
    "health",
    "housing",
    "insurance",
    "pension",
    "welfare",
]
GovernmentLevel = Literal["central", "state"]
ConditionKind = Literal["profile", "manual"]
ConditionOperator = Literal[
    "eq",
    "neq",
    "gte",
    "lte",
    "gt",
    "lt",
    "between",
    "in",
    "truthy",
    "falsy",
]
EducationLevel = Literal[
    "below_school",
    "school_or_college",
    "completed_degree",
    "not_studying",
]
SocialCategory = Literal["general", "obc", "sc", "st", "ews"]
AreaType = Literal["rural", "urban"]
EligibilityOutcome = Literal[
    "potentially_eligible",
    "ineligible",
    "insufficient_information",
    "manual_review",
]
ConditionStatus = Literal["pass", "fail", "unknown"]
ConditionReason = Literal[
    "evaluated",
    "missing_profile_field",
    "manual_verification_required",
    "unsupported_value",
]
GroupStatus = Literal[
    "satisfied",
    "failed",
    "insufficient_information",
    "manual_review",
]

# field name -> validation family.  The eligibility engine only reads these
# fields, so an unknown field in the dataset is a hard validation error.
PROFILE_FIELD_TYPES: dict[str, str] = {
    "age": "int",
    "area": "area",
    "state": "state",
    "annual_income": "int",
    "category": "category",
    "bpl": "bool",
    "indian_citizen": "bool",
    "landholding": "bool",
    "institutional_landholder": "bool",
    "income_tax_payer": "bool",
    "government_employee": "bool",
    "registered_professional": "bool",
    "monthly_pension": "int",
    "bank_account": "bool",
    "informal_self_employed": "bool",
    "vishwakarma_trade": "bool",
    "family_registered_in_scheme": "bool",
    "similar_loan_unrepaid": "bool",
    "similar_loan_in_5_years": "bool",
    "consent_auto_debit": "bool",
    "duplicate_enrolment": "bool",
    "willing_manual_work": "bool",
    "street_vendor": "bool",
    "lost_parent": "bool",
    "education_level": "education",
    "dialysis_patient": "bool",
    "transplant_patient": "bool",
    "hemophilia_patient": "bool",
    "sickle_cell_patient": "bool",
}

_FIELD_VALUES: dict[str, set[str]] = {
    "area": {"rural", "urban"},
    "category": {"general", "obc", "sc", "st", "ews"},
    "education": {
        "below_school",
        "school_or_college",
        "completed_degree",
        "not_studying",
    },
}


def _value_matches(field_type: str, value: Any) -> bool:
    if field_type == "int":
        return isinstance(value, int) and not isinstance(value, bool)
    if field_type == "bool":
        return isinstance(value, bool)
    if field_type in _FIELD_VALUES:
        return isinstance(value, str) and value in _FIELD_VALUES[field_type]
    if field_type == "state":
        return isinstance(value, str) and bool(value.strip())
    return False


class LocalizedText(BaseModel):
    """A string that must exist in every interface language."""

    model_config = ConfigDict(extra="forbid")

    en: str = Field(min_length=1)
    ml: str = Field(min_length=1)
    hi: str = Field(min_length=1)

    def text(self, language: LanguageCode) -> str:
        return getattr(self, language)


class SourceReference(BaseModel):
    """An official source with a verified URL and verification date."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    publisher: str = Field(min_length=1)
    url: str
    verified_on: date

    @field_validator("url")
    @classmethod
    def _validate_source_url(cls, value: str) -> str:
        try:
            return validate_official_url(value)
        except SourcePolicyError as exc:
            raise ValueError(str(exc)) from exc


class Condition(BaseModel):
    """One eligibility condition from the shared condition library.

    ``profile`` conditions are evaluated against the submitted profile.
    ``manual`` conditions can never be decided by this API and drive the
    ``manual_review`` outcome when they are the only remaining checks.
    """

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
    kind: ConditionKind
    label: LocalizedText
    field: str | None = None
    operator: ConditionOperator | None = None
    value: Any | None = None

    @model_validator(mode="after")
    def _validate_condition(self) -> Condition:
        if self.kind == "manual":
            if self.field is not None or self.operator is not None:
                raise ValueError("Manual conditions must not define field or operator.")
            if self.value is not None:
                raise ValueError("Manual conditions must not define a value.")
            return self

        if self.field not in PROFILE_FIELD_TYPES:
            raise ValueError(f"Unknown profile field: {self.field!r}.")
        if self.operator is None:
            raise ValueError("Profile conditions must define an operator.")

        field_type = PROFILE_FIELD_TYPES[self.field]

        if self.operator in {"truthy", "falsy"}:
            if field_type != "bool":
                raise ValueError("truthy/falsy operators require a boolean field.")
            if self.value is not None:
                raise ValueError("truthy/falsy operators must not define a value.")
            return self

        if self.value is None:
            raise ValueError("This operator requires a value.")

        if self.operator in {"gte", "lte", "gt", "lt"}:
            if field_type != "int" or not _value_matches("int", self.value):
                raise ValueError(
                    "Numeric comparison operators require an integer field and value."
                )
            return self

        if self.operator == "between":
            if field_type != "int":
                raise ValueError("between requires an integer field.")
            if (
                not isinstance(self.value, (list, tuple))
                or len(self.value) != 2
                or not all(_value_matches("int", item) for item in self.value)
                or self.value[0] > self.value[1]
            ):
                raise ValueError("between requires an ordered pair of integers.")
            return self

        if self.operator == "in":
            if not isinstance(self.value, (list, tuple)) or not self.value:
                raise ValueError("in requires a non-empty list of values.")
            if not all(_value_matches(field_type, item) for item in self.value):
                raise ValueError("in contains a value of the wrong type.")
            return self

        # eq / neq
        if not _value_matches(field_type, self.value):
            raise ValueError("eq/neq value does not match the field type.")
        return self


class RuleGroup(BaseModel):
    """All conditions in this group must pass for the group to be satisfied."""

    model_config = ConfigDict(extra="forbid")

    all_of: list[str] = Field(min_length=1)

    @field_validator("all_of")
    @classmethod
    def _no_duplicate_conditions(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("A rule group must not repeat a condition id.")
        return value


class SchemeRule(BaseModel):
    """Disjunctive normal form: any one group may establish eligibility."""

    model_config = ConfigDict(extra="forbid")

    any_of: list[RuleGroup] = Field(min_length=1)


class Scheme(BaseModel):
    """A curated scheme record from an official source."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: LocalizedText
    short_name: LocalizedText
    summary: LocalizedText
    description: LocalizedText
    category: SchemeCategory
    government_level: GovernmentLevel
    state: LocalizedText | None = None
    department: LocalizedText
    benefits: list[LocalizedText] = Field(min_length=1)
    documents_required: list[LocalizedText] = Field(min_length=1)
    application_steps: list[LocalizedText] = Field(min_length=1)
    source: SourceReference
    additional_sources: list[SourceReference] = Field(default_factory=list)
    verified_on: date
    keywords: list[str] = Field(default_factory=list)
    rule: SchemeRule

    @model_validator(mode="after")
    def _validate_scheme(self) -> Scheme:
        if self.government_level == "central" and self.state is not None:
            raise ValueError("Central schemes must not define a state.")
        if self.government_level == "state" and self.state is None:
            raise ValueError("State schemes must define a state.")
        if self.verified_on != self.source.verified_on:
            raise ValueError("Scheme and source verification dates must match.")
        return self


class SchemeDataset(BaseModel):
    """The complete, validated scheme dataset."""

    model_config = ConfigDict(extra="forbid")

    version: int = Field(ge=1)
    updated_at: date
    note: str = Field(min_length=1)
    conditions: dict[str, Condition]
    schemes: list[Scheme] = Field(min_length=1)

    @model_validator(mode="after")
    def _validate_dataset(self) -> SchemeDataset:
        scheme_ids = [scheme.id for scheme in self.schemes]
        if len(scheme_ids) != len(set(scheme_ids)):
            raise ValueError("Scheme ids must be unique.")

        for condition_id, condition in self.conditions.items():
            if condition_id != condition.id:
                raise ValueError(
                    f"Condition key {condition_id!r} does not match its id."
                )

        for scheme in self.schemes:
            for group in scheme.rule.any_of:
                for condition_id in group.all_of:
                    if condition_id not in self.conditions:
                        raise ValueError(
                            f"Scheme {scheme.id!r} references unknown condition "
                            f"{condition_id!r}."
                        )

        return self

    def condition(self, condition_id: str) -> Condition:
        return self.conditions[condition_id]


# ---------------------------------------------------------------------------
# Public API response models
# ---------------------------------------------------------------------------


class SchemeListItem(BaseModel):
    id: str
    name: str
    short_name: str
    summary: str
    category: SchemeCategory
    government_level: GovernmentLevel
    state: str | None
    department: str
    benefit_highlights: list[str]
    verified_on: date
    source: SourceReference


class SchemeListResponse(BaseModel):
    language: LanguageCode
    items: list[SchemeListItem]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_pages: int = Field(ge=0)
    query: str | None
    category: SchemeCategory | None
    government_level: GovernmentLevel | None
    message: str | None
    content_note: str
    disclaimer: str


class SchemeConditionSummary(BaseModel):
    id: str
    label: str
    manual: bool


class SchemeDetail(BaseModel):
    id: str
    name: str
    short_name: str
    summary: str
    description: str
    category: SchemeCategory
    government_level: GovernmentLevel
    state: str | None
    department: str
    benefits: list[str]
    documents_required: list[str]
    application_steps: list[str]
    source: SourceReference
    additional_sources: list[SourceReference] = Field(default_factory=list)
    verified_on: date
    conditions: list[SchemeConditionSummary]
    content_note: str
    disclaimer: str


class EligibilityRequest(BaseModel):
    """Profile fields used by the deterministic rules engine.

    The request deliberately has no name, Aadhaar, phone or address field.
    ``extra="forbid"`` stops unplanned sensitive fields from arriving.
    """

    model_config = ConfigDict(extra="forbid")

    language: LanguageCode = "en"

    age: int | None = Field(default=None, ge=0, le=120)
    area: AreaType | None = None
    state: str | None = Field(default=None, min_length=1, max_length=64)
    annual_income: int | None = Field(default=None, ge=0, le=1_000_000_000)
    category: SocialCategory | None = None
    bpl: bool | None = None
    indian_citizen: bool | None = None
    landholding: bool | None = None
    institutional_landholder: bool | None = None
    income_tax_payer: bool | None = None
    government_employee: bool | None = None
    registered_professional: bool | None = None
    monthly_pension: int | None = Field(default=None, ge=0, le=1_000_000)
    bank_account: bool | None = None
    informal_self_employed: bool | None = None
    vishwakarma_trade: bool | None = None
    family_registered_in_scheme: bool | None = None
    similar_loan_unrepaid: bool | None = None
    similar_loan_in_5_years: bool | None = None
    consent_auto_debit: bool | None = None
    duplicate_enrolment: bool | None = None
    willing_manual_work: bool | None = None
    street_vendor: bool | None = None
    lost_parent: bool | None = None
    education_level: EducationLevel | None = None
    dialysis_patient: bool | None = None
    transplant_patient: bool | None = None
    hemophilia_patient: bool | None = None
    sickle_cell_patient: bool | None = None

    @field_validator("state")
    @classmethod
    def _strip_state(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class EligibilityConditionResult(BaseModel):
    id: str
    label: str
    status: ConditionStatus
    reason: ConditionReason
    message: str


class EligibilityGroupResult(BaseModel):
    status: GroupStatus
    condition_ids: list[str]
    message: str


class SchemeEligibilityResult(BaseModel):
    scheme_id: str
    scheme_name: str
    category: SchemeCategory
    government_level: GovernmentLevel
    outcome: EligibilityOutcome
    summary: str
    outcome_message: str
    conditions: list[EligibilityConditionResult]
    groups: list[EligibilityGroupResult]
    verified_on: date
    source: SourceReference
    disclaimer: str


class EligibilityResponse(BaseModel):
    language: LanguageCode
    checked_at: datetime
    profile_fields_received: list[str]
    results: list[SchemeEligibilityResult]
    disclaimer: str
