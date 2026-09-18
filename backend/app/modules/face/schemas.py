"""
Pydantic schemas for the Face Analysis module.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class FaceMetrics(BaseModel):
    eye_contact_pct: float = Field(..., description="Eye contact percentage (0-100)")
    blink_rate_status: str = Field(..., description="'Normal' | 'Low' | 'High'")
    head_stability_pct: float = Field(..., description="Head stability percentage (0-100)")
    micro_expressions_level: str = Field(..., description="'Low' | 'Medium' | 'High'")
    facial_tension_pct: float = Field(..., description="Facial muscle tension (0-100)")


class FaceAnalysisData(BaseModel):
    face_score: float = Field(..., description="Truthfulness/composure likelihood (0-100)")
    confidence: float = Field(..., description="Model detection confidence (0-100)")
    metrics: FaceMetrics
    key_reasons: List[str] = Field(default_factory=list)


class FaceAnalysisRequest(BaseModel):
    session_id: str
    frame_timestamp_ms: Optional[float] = None
    frame_base64: Optional[str] = None


class FaceAnalysisResponse(BaseModel):
    status: str = "success"
    data: FaceAnalysisData
    annotated_frame: Optional[str] = None


class FaceFrameRequest(BaseModel):
    session_id: str = "live_session"
    frame_base64: str = Field(..., description="Base64 encoded JPEG or PNG image frame")


class FaceFrameResponse(BaseModel):
    status: str = "success"
    faces_detected: int = 0
    face_score: float = 85.0
    confidence: float = 90.0
    metrics: FaceMetrics
    key_reasons: List[str] = Field(default_factory=list)
    annotated_frame: Optional[str] = Field(None, description="Base64 encoded JPEG with OpenCV annotations")
