"""Pydantic schemas for the Face Analysis module.

IMPORTANT FOR DEVELOPER 1:
- Replace ONLY `service.py` with your real ML model implementation.
- Do NOT modify these schemas. The frontend and fusion engine depend on this exact contract.
- Your service must return a `FaceAnalysisResponse` object.
"""
from pydantic import BaseModel, Field
from typing import Literal


class FaceAnalysisRequest(BaseModel):
    """Request payload for face analysis. Extend with additional fields if needed."""

    session_id: str = Field(..., description="Active session identifier")
    frame_timestamp_ms: float | None = Field(None, description="Frame timestamp in milliseconds")


class FaceMetrics(BaseModel):
    """Detailed per-metric breakdown from face analysis."""

    eye_contact_pct: float = Field(..., ge=0, le=100, description="Eye contact percentage")
    blink_rate_status: str = Field(..., description="Blink rate status (Normal / Low / High)")
    head_stability_pct: float = Field(..., ge=0, le=100, description="Head stability percentage")
    micro_expressions_level: str = Field(..., description="Micro expression intensity (Low / Medium / High)")
    facial_tension_pct: float = Field(..., ge=0, le=100, description="Facial tension percentage")


class FaceAnalysisData(BaseModel):
    """Nested data object within the face analysis response."""

    face_score: float = Field(..., ge=0, le=100, description="Overall face truthfulness score (0–100)")
    confidence: float = Field(..., ge=0, le=100, description="Model confidence (0–100)")
    metrics: FaceMetrics
    key_reasons: list[str] = Field(..., description="Top reasons contributing to the face score")


class FaceAnalysisResponse(BaseModel):
    """Standard response envelope for the face analysis endpoint."""

    status: Literal["success", "error"] = "success"
    data: FaceAnalysisData
