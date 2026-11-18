"""Evidence-grounded assistant endpoint.

The blocking retrieval and Gemini call run in a threadpool. No conversation
history is persisted; each request is validated and answered independently.
"""

from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool

from app.models.assistant import AssistantAskRequest, AssistantAskResponse
from app.services.assistant_service import AssistantService

router = APIRouter(prefix="/assistant", tags=["Assistant"])


def _service(request: Request) -> AssistantService:
    return request.app.state.assistant_service


@router.post(
    "/ask",
    response_model=AssistantAskResponse,
    summary="Ask a grounded question",
    description=(
        "Answers only from passages retrieved from uploaded government "
        "documents. Validated citations are populated by the backend. Returns "
        "an honest insufficient-evidence response when the documents do not "
        "answer the question. No history is stored."
    ),
)
async def ask_assistant(
    request: Request, payload: AssistantAskRequest
) -> AssistantAskResponse:
    return await run_in_threadpool(
        _service(request).ask,
        request=payload,
    )
