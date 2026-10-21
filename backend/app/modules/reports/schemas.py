"""Pydantic schemas for the PDF Report generation module."""
from datetime import datetime
from pydantic import BaseModel, Field

from app.modules.face.schemas import FaceAnalysisData
from app.modules.fusion.schemas import FusionResponse
from app.modules.text.schemas import TextAnalysisResponse
from app.modules.voice.schemas import VoiceAnalysisResponse


class ReportRequest(BaseModel):
    """Request payload for generating a forensic PDF report."""

    session_id: str = Field(..., description="Session to generate report for")
    subject_label: str | None = Field(None, description="Optional subject identifier")
    include_timeline: bool = Field(True, description="Include timeline analytics section")
    include_transcript: bool = Field(True, description="Include full transcript section")
    face_data: FaceAnalysisData | None = Field(None, description="Optional snapshot of face analysis data")
    voice_data: VoiceAnalysisResponse | None = Field(None, description="Optional snapshot of voice analysis data")
    text_data: TextAnalysisResponse | None = Field(None, description="Optional snapshot of text analysis data")
    fusion_data: FusionResponse | None = Field(None, description="Optional snapshot of fusion analysis data")
    case_data: dict | None = Field(None, description="Optional snapshot of case evidence and NLI verification")


class ReportResponse(BaseModel):
    """Response after report generation."""

    report_id: str = Field(..., description="Unique report UUID")
    session_id: str
    generated_at: datetime
    file_path: str = Field(..., description="Server-side path to the generated PDF")
    file_size_bytes: int | None = None
    download_url: str = Field(..., description="URL to download the report")

