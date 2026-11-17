"""Deterministic, three-valued eligibility engine.

No language model is involved. Each condition is compared against an
explicit profile field using a documented operator. A missing field is
always ``unknown``, never ``pass``: the engine must not assume facts the
citizen has not supplied.

Group semantics
---------------
A scheme rule is disjunctive normal form: any one group (``all_of``) may
establish eligibility. Within a group:

- one failed condition fails the group;
- otherwise an unknown manual condition makes the group ``manual_review``;
- otherwise any unknown profile condition makes it
  ``insufficient_information``;
- otherwise the group is satisfied.

Manual conditions exist where an official check (SECC listing, a state
eligibility list, a project area, a district victim list) cannot be
faithfully evaluated from the profile. They are never guessed.
"""

from __future__ import annotations

from typing import Any

from app.models.schemes import (
    Condition,
    ConditionReason,
    ConditionStatus,
    EligibilityConditionResult,
    EligibilityGroupResult,
    EligibilityOutcome,
    EligibilityRequest,
    GroupStatus,
    LanguageCode,
    RuleGroup,
    Scheme,
    SchemeDataset,
    SchemeEligibilityResult,
)

ELIGIBILITY_DISCLAIMER: dict[LanguageCode, str] = {
    "en": (
        "This is a preliminary, rule-based assessment, not an official "
        "eligibility decision. Final eligibility is determined by the "
        "relevant government authority."
    ),
    "ml": (
        "ഇത് ഒരു പ്രാഥമിക, നിയമാധിഷ്ഠിത വിലയിരുത്തലാണ്; ഔദ്യോഗിക യോഗ്യതാ "
        "തീരുമാനമല്ല. അന്തിമ യോഗ്യത ബന്ധപ്പെട്ട സർക്കാർ അധികാരിയാണ് "
        "നിർണ്ണയിക്കുന്നത്."
    ),
    "hi": (
        "यह एक प्रारंभिक, नियम-आधारित आकलन है, आधिकारिक पात्रता निर्णय नहीं। "
        "अंतिम पात्रता संबंधित सरकारी प्राधिकरण तय करता है।"
    ),
}

_OUTCOME_MESSAGES: dict[LanguageCode, dict[EligibilityOutcome, str]] = {
    "en": {
        "potentially_eligible": (
            "You meet every encoded condition checked by this tool. This is "
            "not an official eligibility decision."
        ),
        "ineligible": (
            "At least one encoded condition is not met, so this scheme does "
            "not currently appear to apply."
        ),
        "insufficient_information": (
            "Some details needed for this scheme are missing. Add them for a "
            "clearer result."
        ),
        "manual_review": (
            "Some official conditions cannot be checked by this tool and "
            "need manual verification."
        ),
    },
    "ml": {
        "potentially_eligible": (
            "ഈ ഉപകരണം പരിശോധിക്കുന്ന എല്ലാ വ്യവസ്ഥകളും നിങ്ങൾ പാലിക്കുന്നു. "
            "ഇത് ഔദ്യോഗിക യോഗ്യതാ തീരുമാനമല്ല."
        ),
        "ineligible": (
            "എൻകോഡ് ചെയ്ത കുറഞ്ഞത് ഒരു വ്യവസ്ഥ പാലിക്കുന്നില്ല; അതിനാൽ ഈ പദ്ധതി ഇപ്പോൾ ബാധകമാകുന്നില്ല."
        ),
        "insufficient_information": (
            "ഈ പദ്ധതിക്ക് ആവശ്യമായ ചില വിവരങ്ങൾ ലഭ്യമല്ല. വ്യക്തമായ ഫലത്തിന് അവ നൽകുക."
        ),
        "manual_review": (
            "ചില ഔദ്യോഗിക വ്യവസ്ഥകൾ ഈ ഉപകരണത്തിന് പരിശോധിക്കാനാവില്ല; കൈകൊണ്ട് പരിശോധിക്കേണ്ടതുണ്ട്."
        ),
    },
    "hi": {
        "potentially_eligible": (
            "आप इस उपकरण द्वारा जाँची जाने वाली हर एन्कोडेड शर्त पूरी करते हैं। "
            "यह आधिकारिक पात्रता निर्णय नहीं है।"
        ),
        "ineligible": (
            "कम से कम एक एन्कोडेड शर्त पूरी नहीं होती, इसलिए यह योजना अभी लागू नहीं होती दिखती।"
        ),
        "insufficient_information": (
            "इस योजना के लिए कुछ जानकारी उपलब्ध नहीं है। स्पष्ट परिणाम के लिए उसे जोड़ें।"
        ),
        "manual_review": (
            "कुछ आधिकारिक शर्तें इस उपकरण से जाँची नहीं जा सकतीं और उनकी मैन्युअल जाँच आवश्यक है।"
        ),
    },
}

_CONDITION_SUFFIXES: dict[LanguageCode, dict[str, str]] = {
    "en": {
        "pass": "met.",
        "fail": "not met.",
        "missing": "information missing.",
        "manual": "needs manual verification.",
        "unsupported": "could not be checked.",
    },
    "ml": {
        "pass": "പാലിക്കുന്നു.",
        "fail": "പാലിക്കുന്നില്ല.",
        "missing": "വിവരം ലഭ്യമല്ല.",
        "manual": "കൈകൊണ്ട് പരിശോധിക്കണം.",
        "unsupported": "പരിശോധിക്കാനായില്ല.",
    },
    "hi": {
        "pass": "पूरा होता है।",
        "fail": "पूरा नहीं होता।",
        "missing": "जानकारी उपलब्ध नहीं।",
        "manual": "मैन्युअल जाँच आवश्यक।",
        "unsupported": "जाँच नहीं हो सकी।",
    },
}

_GROUP_MESSAGES: dict[LanguageCode, dict[GroupStatus, str]] = {
    "en": {
        "satisfied": "All conditions in this route are met.",
        "failed": "At least one condition in this route is not met.",
        "insufficient_information": ("Some details needed for this route are missing."),
        "manual_review": ("Some conditions in this route need manual verification."),
    },
    "ml": {
        "satisfied": "ഈ വഴിയിലെ എല്ലാ വ്യവസ്ഥകളും പാലിക്കുന്നു.",
        "failed": "ഈ വഴിയിലെ കുറഞ്ഞത് ഒരു വ്യവസ്ഥ പാലിക്കുന്നില്ല.",
        "insufficient_information": ("ഈ വഴിക്ക് ആവശ്യമായ ചില വിവരങ്ങൾ ലഭ്യമല്ല."),
        "manual_review": ("ഈ വഴിയിലെ ചില വ്യവസ്ഥകൾ കൈകൊണ്ട് പരിശോധിക്കണം."),
    },
    "hi": {
        "satisfied": "इस मार्ग की सभी शर्तें पूरी होती हैं।",
        "failed": "इस मार्ग की कम से कम एक शर्त पूरी नहीं होती।",
        "insufficient_information": ("इस मार्ग के लिए कुछ जानकारी उपलब्ध नहीं है।"),
        "manual_review": ("इस मार्ग की कुछ शर्तों की मैन्युअल जाँच आवश्यक है।"),
    },
}


def _normalise(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip().casefold()
    return value


def _matches(condition: Condition, actual: Any) -> bool:
    """Compare one supplied value with the condition's encoded expectation."""
    operator = condition.operator
    expected = condition.value

    if operator == "truthy":
        return bool(actual) is True
    if operator == "falsy":
        return actual is False
    if operator == "eq":
        return _normalise(actual) == _normalise(expected)
    if operator == "neq":
        return _normalise(actual) != _normalise(expected)
    if operator == "in":
        return _normalise(actual) in {_normalise(item) for item in expected}
    if operator == "between":
        low, high = expected
        return low <= actual <= high
    if operator == "gte":
        return actual >= expected
    if operator == "lte":
        return actual <= expected
    if operator == "gt":
        return actual > expected
    if operator == "lt":
        return actual < expected

    raise ValueError(f"Unsupported operator: {operator!r}")


def _message(
    condition: Condition,
    language: LanguageCode,
    key: str,
) -> str:
    label = getattr(condition.label, language)
    return f"{label} — {_CONDITION_SUFFIXES[language][key]}"


def evaluate_condition(
    condition: Condition,
    profile: dict[str, Any],
    language: LanguageCode,
) -> EligibilityConditionResult:
    """Evaluate one condition with three-valued logic."""
    if condition.kind == "manual":
        return EligibilityConditionResult(
            id=condition.id,
            label=getattr(condition.label, language),
            status="unknown",
            reason="manual_verification_required",
            message=_message(condition, language, "manual"),
        )

    field = condition.field
    if field is None:  # defensive: model validation prevents this
        status: ConditionStatus = "unknown"
        reason: ConditionReason = "unsupported_value"
    else:
        actual = profile.get(field)
        if actual is None:
            status = "unknown"
            reason = "missing_profile_field"
        else:
            try:
                passed = _matches(condition, actual)
            except (TypeError, ValueError):
                status = "unknown"
                reason = "unsupported_value"
            else:
                status = "pass" if passed else "fail"
                reason = "evaluated"

    key = {
        "pass": "pass",
        "fail": "fail",
        "unknown": (
            "manual"
            if reason == "manual_verification_required"
            else "missing"
            if reason == "missing_profile_field"
            else "unsupported"
        ),
    }[status]

    return EligibilityConditionResult(
        id=condition.id,
        label=getattr(condition.label, language),
        status=status,
        reason=reason,
        message=_message(condition, language, key),
    )


def _group_status(
    group: RuleGroup,
    results: dict[str, EligibilityConditionResult],
) -> GroupStatus:
    group_results = [results[condition_id] for condition_id in group.all_of]

    if any(result.status == "fail" for result in group_results):
        return "failed"
    if any(
        result.status == "unknown" and result.reason == "manual_verification_required"
        for result in group_results
    ):
        return "manual_review"
    if any(result.status == "unknown" for result in group_results):
        return "insufficient_information"
    return "satisfied"


def _scheme_outcome(statuses: list[GroupStatus]) -> EligibilityOutcome:
    if "satisfied" in statuses:
        return "potentially_eligible"
    if "manual_review" in statuses:
        return "manual_review"
    if "insufficient_information" in statuses:
        return "insufficient_information"
    return "ineligible"


def evaluate_scheme(
    scheme: Scheme,
    dataset: SchemeDataset,
    profile: dict[str, Any],
    language: LanguageCode,
) -> SchemeEligibilityResult:
    """Evaluate every rule route for one scheme and explain the result."""
    ordered_ids: list[str] = []
    for group in scheme.rule.any_of:
        for condition_id in group.all_of:
            if condition_id not in ordered_ids:
                ordered_ids.append(condition_id)

    results = {
        condition_id: evaluate_condition(
            dataset.conditions[condition_id], profile, language
        )
        for condition_id in ordered_ids
    }

    groups: list[EligibilityGroupResult] = []
    group_statuses: list[GroupStatus] = []
    for group in scheme.rule.any_of:
        status = _group_status(group, results)
        group_statuses.append(status)
        groups.append(
            EligibilityGroupResult(
                status=status,
                condition_ids=list(group.all_of),
                message=_GROUP_MESSAGES[language][status],
            )
        )

    outcome = _scheme_outcome(group_statuses)

    return SchemeEligibilityResult(
        scheme_id=scheme.id,
        scheme_name=getattr(scheme.name, language),
        category=scheme.category,
        government_level=scheme.government_level,
        outcome=outcome,
        summary=getattr(scheme.summary, language),
        outcome_message=_OUTCOME_MESSAGES[language][outcome],
        conditions=[results[condition_id] for condition_id in ordered_ids],
        groups=groups,
        verified_on=scheme.verified_on,
        source=scheme.source,
        disclaimer=ELIGIBILITY_DISCLAIMER[language],
    )


def profile_values(request: EligibilityRequest) -> dict[str, Any]:
    """Return only the allowlisted profile fields, never the raw request."""
    return {
        name: getattr(request, name)
        for name in type(request).model_fields
        if name != "language"
    }
