"""Pydantic schemas for the Text & Fact-Check Analysis module.

IMPORTANT FOR DEVELOPER 3:
- Replace ONLY `service.py` with your real NLP/fact-check implementation.
- Do NOT modify these schemas. The frontend and fusion engine depend on this exact contract.
- Your service must return a `TextAnalysisResponse` object.
"""
from pydantic import BaseModel, Field
from typing import Literal


class TextAnalysisRequest(BaseModel):
    """Request payload for text/transcript analysis."""

    session_id: str = Field(..., description="Active session identifier")
    transcript: str | None = Field(None, description="Optional pre-transcribed text")


class HighlightedStatement(BaseModel):
    """A single highlighted phrase from the transcript with its verification status."""

    text: str = Field(..., description="The specific phrase or claim")
    status: Literal["SUPPORTED", "UNCERTAIN", "CONTRADICTED"] = Field(
        ..., description="Fact-check status of this statement"
    )
    evidence: str = Field(..., description="Evidence source or explanation")


class FactCheckResult(BaseModel):
    """A single evidence card from external fact-checking sources."""

    source: str = Field(..., description="Evidence source name (e.g., Calendar Event)")
    claim: str = Field(..., description="The claim made by the source")
    result: Literal["SUPPORTED", "UNCERTAIN", "CONTRADICTED"] = Field(
        ..., description="Fact-check result"
    )


class TextAnalysisResponse(BaseModel):
    """Standard response envelope for the text analysis endpoint."""

    text_score: float = Field(..., ge=0, le=100, description="Overall text truthfulness score (0–100)")
    confidence: float = Field(..., ge=0, le=100, description="Model confidence (0–100)")
    transcript: str = Field(..., description="Full analyzed transcript")
    highlighted_statements: list[HighlightedStatement] = Field(
        ..., description="Phrases with inline fact-check status"
    )
    fact_check_results: list[FactCheckResult] = Field(
        ..., description="External evidence cross-reference cards"
    )
    key_reasons: list[str] = Field(..., description="Top linguistic analysis reasons")
