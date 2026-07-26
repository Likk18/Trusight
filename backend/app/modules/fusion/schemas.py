"""Pydantic schemas for the Fusion Engine module.

The Fusion Engine is intentionally isolated:
- It ONLY consumes standardized API responses from face, voice, and text modules.
- It has NO knowledge of internal model implementations.
- Adding a new modality requires only: adding a field to FusionRequest and updating fusion_model.py weights.
"""
from pydantic import BaseModel, Field
from typing import Literal


class FusionRequest(BaseModel):
    """Request payload for fusion synthesis — contains only normalized scores."""

    session_id: str = Field(..., description="Active session identifier")
    face_score: float = Field(..., ge=0, le=100)
    face_confidence: float = Field(..., ge=0, le=100)
    voice_score: float = Field(..., ge=0, le=100, description="Derived from (100 - deception_score)")
    voice_confidence: float = Field(..., ge=0, le=100)
    text_score: float = Field(..., ge=0, le=100)
    text_confidence: float = Field(..., ge=0, le=100)


class ContributorDetail(BaseModel):
    """Weight and directional impact of a single contributing factor."""

    weight_pct: float = Field(..., description="Percentage contribution weight")
    impact: Literal["positive", "negative"] = Field(..., description="Directional impact")


class ModelAgreement(BaseModel):
    """Score parity across all modalities."""

    face_score: float
    voice_score: float
    text_score: float
    evidence_score: float
    overall_agreement_pct: float


class SystemStatus(BaseModel):
    """Environmental and system quality indicators."""

    uncertainty_level: Literal["LOW", "MEDIUM", "HIGH"]
    video_quality: str
    audio_quality: str
    lighting: str
    background_noise: str
    processing_latency_ms: int


class FusionResponse(BaseModel):
    """Complete fusion synthesis response — the final truth assessment."""
    model_config = {"protected_namespaces": ()}

    truth_likelihood_pct: float = Field(..., ge=0, le=100)
    fusion_confidence_pct: float = Field(..., ge=0, le=100)
    verdict: str = Field(..., description="Human-readable verdict string")
    explanation: str = Field(..., description="Synthesized plain-English explanation")
    contributors: dict[str, ContributorDetail] = Field(
        ..., description="Weighted contributing factors map"
    )
    model_agreement: ModelAgreement
    system_status: SystemStatus
