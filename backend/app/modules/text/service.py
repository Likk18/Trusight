"""
DUMMY Text & Fact-Check AI Service — for development and integration testing.

=============================================================
DEVELOPER 3 HANDOFF INSTRUCTIONS
=============================================================
Replace THIS FILE ONLY with your real NLP/fact-check ML model.

Contract requirements:
  - Accept a `TextAnalysisRequest` object as input.
  - Return a `TextAnalysisResponse` object as output.
  - Do NOT modify schemas.py, router.py, or any other file.
  - highlighted_statements must use SUPPORTED/UNCERTAIN/CONTRADICTED literals.
=============================================================
"""
import random
from app.modules.text.schemas import (
    TextAnalysisRequest,
    TextAnalysisResponse,
    HighlightedStatement,
    FactCheckResult,
)
from app.shared.helpers import simulate_variance, clamp
from app.shared.logger import get_logger

logger = get_logger(__name__)

_SAMPLE_TRANSCRIPT = (
    "I arrived at the office around 10:15 AM. I had a meeting with the team and "
    "we discussed the new project requirements. After that, I worked on the proposal "
    "and submitted it by 2 PM."
)

_HIGHLIGHTED_STATEMENTS = [
    HighlightedStatement(text="10:15 AM", status="SUPPORTED", evidence="Calendar Event / Login Log"),
    HighlightedStatement(text="meeting", status="UNCERTAIN", evidence="No direct calendar invite found"),
    HighlightedStatement(text="new project requirements", status="SUPPORTED", evidence="Project Document matches statement"),
    HighlightedStatement(text="submitted it by 2 PM", status="SUPPORTED", evidence="Email Record sent at 1:58 PM"),
]

_FACT_CHECK_RESULTS = [
    FactCheckResult(source="Calendar Event", claim="10:00 AM - 11:00 AM", result="SUPPORTED"),
    FactCheckResult(source="Project Document", claim="Matches statement", result="SUPPORTED"),
    FactCheckResult(source="Email Record", claim="Sent at 1:58 PM", result="SUPPORTED"),
    FactCheckResult(source="System Log", claim="Login at 10:12 AM", result="SUPPORTED"),
]

_KEY_REASONS_POOL = [
    "High linguistic consistency across statements",
    "Low uncertainty phrasing / hedging words",
    "Clear, direct syntactic structures",
    "Factual claims corroborated by multiple sources",
    "No anachronistic language patterns detected",
    "Semantic coherence score above threshold",
]


async def analyze(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """
    DUMMY implementation: returns simulated text/fact-check analysis.
    Replace this function body with real NLP model inference for production.
    """
    logger.info(f"[DUMMY] Text analysis for session {request.session_id}")

    text_score = clamp(simulate_variance(91.0, 4.0))
    confidence = clamp(simulate_variance(89.0, 3.0))

    transcript = request.transcript or _SAMPLE_TRANSCRIPT
    key_reasons = random.sample(_KEY_REASONS_POOL, k=3)

    return TextAnalysisResponse(
        text_score=round(text_score, 1),
        confidence=round(confidence, 1),
        transcript=transcript,
        highlighted_statements=_HIGHLIGHTED_STATEMENTS,
        fact_check_results=_FACT_CHECK_RESULTS,
        key_reasons=key_reasons,
    )
