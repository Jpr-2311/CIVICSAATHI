"""Scheme discovery responses built from the validated dataset.

Route handlers stay thin: this module turns repository records into the
localised API contract and owns the honesty language shown beside every
record. Nothing here invents content; every string comes from the curated
dataset or from an explicit interface notice.
"""

from __future__ import annotations

from math import ceil

from app.database.scheme_repository import SchemeRepository
from app.models.schemes import (
    GovernmentLevel,
    LanguageCode,
    Scheme,
    SchemeCategory,
    SchemeConditionSummary,
    SchemeDetail,
    SchemeListItem,
    SchemeListResponse,
)

CONTENT_NOTE: dict[LanguageCode, str] = {
    "en": (
        "English scheme content is a verified editorial summary of the "
        "linked official sources. Malayalam and Hindi are editorial "
        "translations for the interface, not official translations."
    ),
    "ml": (
        "ഇംഗ്ലീഷ് പദ്ധതി വിവരങ്ങൾ ബന്ധിപ്പിച്ച ഔദ്യോഗിക ഉറവിടങ്ങളുടെ "
        "പരിശോധിച്ച എഡിറ്റോറിയൽ സംഗ്രഹമാണ്. മലയാളവും ഹിന്ദിയും ഇന്റർഫേസിനായുള്ള "
        "എഡിറ്റോറിയൽ വിവർത്തനങ്ങളാണ്, ഔദ്യോഗിക വിവർത്തനങ്ങളല്ല."
    ),
    "hi": (
        "अंग्रेज़ी में योजना की जानकारी जुड़े आधिकारिक स्रोतों का सत्यापित "
        "संपादकीय सारांश है। मलयालम और हिंदी इंटरफ़ेस के लिए संपादकीय अनुवाद हैं, "
        "आधिकारिक अनुवाद नहीं।"
    ),
}

SCHEME_DISCLAIMER: dict[LanguageCode, str] = {
    "en": (
        "CIVICSAATHI AI is a hackathon prototype, not an official government "
        "service. Verify every detail on the linked official source before "
        "applying."
    ),
    "ml": (
        "CIVICSAATHI AI ഒരു ഹാക്കത്തോൺ പ്രോട്ടോടൈപ്പാണ്, ഔദ്യോഗിക സർക്കാർ "
        "സേവനമല്ല. അപേക്ഷിക്കുന്നതിന് മുമ്പ് ബന്ധിപ്പിച്ച ഔദ്യോഗിക ഉറവിടത്തിൽ "
        "എല്ലാ വിവരങ്ങളും പരിശോധിക്കുക."
    ),
    "hi": (
        "CIVICSAATHI AI एक हैकाथॉन प्रोटोटाइप है, आधिकारिक सरकारी सेवा नहीं। "
        "आवेदन करने से पहले जुड़े आधिकारिक स्रोत पर हर विवरण सत्यापित करें।"
    ),
}

_EMPTY_FILTERED: dict[LanguageCode, str] = {
    "en": (
        "No schemes matched this search. Try a different keyword or clear the filters."
    ),
    "ml": (
        "ഈ തിരയലിന് പദ്ധതികളൊന്നും ലഭിച്ചില്ല. മറ്റൊരു കീവേഡ് പരീക്ഷിക്കുക അല്ലെങ്കിൽ ഫിൽട്ടറുകൾ മാറ്റുക."
    ),
    "hi": ("इस खोज से कोई योजना नहीं मिली। कोई दूसरा शब्द आज़माएँ या फ़िल्टर हटाएँ।"),
}

_EMPTY_DATASET: dict[LanguageCode, str] = {
    "en": "No curated schemes are available yet.",
    "ml": "ഇതുവരെ ശേഖരിച്ച പദ്ധതികളൊന്നും ലഭ്യമല്ല.",
    "hi": "अभी कोई क्यूरेटेड योजना उपलब्ध नहीं है।",
}

_PAGE_BEYOND: dict[LanguageCode, str] = {
    "en": "This page is beyond the available results. Return to an earlier page.",
    "ml": "ഈ പേജ് ലഭ്യമായ ഫലങ്ങൾക്കപ്പുറമാണ്. മുമ്പത്തെ പേജിലേക്ക് മടങ്ങുക.",
    "hi": "यह पृष्ठ उपलब्ध परिणामों से आगे है। किसी पिछले पृष्ठ पर लौटें।",
}


def _text(localised, language: LanguageCode) -> str:
    return getattr(localised, language)


def _condition_ids(scheme: Scheme) -> list[str]:
    """Condition ids in rule order, without duplicates."""
    ordered: list[str] = []
    for group in scheme.rule.any_of:
        for condition_id in group.all_of:
            if condition_id not in ordered:
                ordered.append(condition_id)
    return ordered


def _list_message(
    *,
    language: LanguageCode,
    total: int,
    page_item_count: int,
    query: str | None,
    category: SchemeCategory | None,
    government_level: GovernmentLevel | None,
) -> str | None:
    if total == 0:
        if query or category or government_level:
            return _EMPTY_FILTERED[language]
        return _EMPTY_DATASET[language]
    if page_item_count == 0:
        return _PAGE_BEYOND[language]
    return None


def build_scheme_list(
    repository: SchemeRepository,
    *,
    language: LanguageCode,
    query: str | None,
    category: SchemeCategory | None,
    government_level: GovernmentLevel | None,
    page: int,
    page_size: int,
) -> SchemeListResponse:
    clean_query = query.strip() if query and query.strip() else None
    schemes, total = repository.query(
        query=clean_query,
        category=category,
        government_level=government_level,
        page=page,
        page_size=page_size,
    )

    items = [
        SchemeListItem(
            id=scheme.id,
            name=_text(scheme.name, language),
            short_name=_text(scheme.short_name, language),
            summary=_text(scheme.summary, language),
            category=scheme.category,
            government_level=scheme.government_level,
            state=(_text(scheme.state, language) if scheme.state is not None else None),
            department=_text(scheme.department, language),
            benefit_highlights=[
                _text(benefit, language) for benefit in scheme.benefits[:2]
            ],
            verified_on=scheme.verified_on,
            source=scheme.source,
        )
        for scheme in schemes
    ]

    return SchemeListResponse(
        language=language,
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total else 0,
        query=clean_query,
        category=category,
        government_level=government_level,
        message=_list_message(
            language=language,
            total=total,
            page_item_count=len(items),
            query=clean_query,
            category=category,
            government_level=government_level,
        ),
        content_note=CONTENT_NOTE[language],
        disclaimer=SCHEME_DISCLAIMER[language],
    )


def build_scheme_detail(
    repository: SchemeRepository,
    *,
    scheme_id: str,
    language: LanguageCode,
) -> SchemeDetail | None:
    scheme = repository.get_scheme(scheme_id)
    if scheme is None:
        return None

    dataset = repository.get_dataset()
    conditions = [
        SchemeConditionSummary(
            id=condition_id,
            label=_text(dataset.conditions[condition_id].label, language),
            manual=dataset.conditions[condition_id].kind == "manual",
        )
        for condition_id in _condition_ids(scheme)
    ]

    return SchemeDetail(
        id=scheme.id,
        name=_text(scheme.name, language),
        short_name=_text(scheme.short_name, language),
        summary=_text(scheme.summary, language),
        description=_text(scheme.description, language),
        category=scheme.category,
        government_level=scheme.government_level,
        state=_text(scheme.state, language) if scheme.state is not None else None,
        department=_text(scheme.department, language),
        benefits=[_text(benefit, language) for benefit in scheme.benefits],
        documents_required=[
            _text(document, language) for document in scheme.documents_required
        ],
        application_steps=[_text(step, language) for step in scheme.application_steps],
        source=scheme.source,
        additional_sources=scheme.additional_sources,
        verified_on=scheme.verified_on,
        conditions=conditions,
        content_note=CONTENT_NOTE[language],
        disclaimer=SCHEME_DISCLAIMER[language],
    )
