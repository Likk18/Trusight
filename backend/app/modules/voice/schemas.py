"""Pydantic schemas for the Voice Analysis module."""
from pydantic import BaseModel, Field


class VoiceAnalysisRequest(BaseModel):
    """Request payload for voice analysis."""

    session_id: str = Field(..., description="Active session identifier")
    audio_chunk_id: int | None = Field(None, description="Sequential audio chunk index")


class VoiceMetrics(BaseModel):
    """Detailed per-metric breakdown from voice analysis."""

    pitch_status: str = Field(..., description="Pitch status (Normal / High / Low)")
    speech_rate_wpm: float = Field(..., description="Speech rate in words per minute")
    energy_pct: float = Field(..., ge=0, le=100, description="Vocal energy percentage")
    hesitation_level: str = Field(..., description="Hesitation level (Low / Medium / High)")
    pauses_count: int = Field(..., ge=0, description="Number of detected pauses")
    stability_status: str = Field(default="Stable", description="Voice perturbation stability (Stable / Tremor)")
    jitter_pct: float | None = Field(default=None, description="Local jitter perturbation percentage")
    shimmer_pct: float | None = Field(default=None, description="Local shimmer perturbation percentage")


class VoiceAnalysisResponse(BaseModel):
    """Standard response envelope for the voice analysis endpoint."""

    model_config = {"protected_namespaces": ()}

    verdict: str = Field(..., description="Human verdict (Truthful / Deceptive / Uncertain)")
    deception_score: float = Field(..., ge=0, le=100, description="Deception probability score (0–100)")
    model_confidence: float = Field(..., ge=0, le=100, description="Model confidence (0–100)")
    metrics: VoiceMetrics
    observations: list[str] = Field(..., description="Detailed acoustic observations")
    key_reasons: list[str] = Field(..., description="Summary reasons for the verdict")
