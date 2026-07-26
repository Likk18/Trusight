"""Pydantic schemas for the PDF Report generation module."""
from pydantic import BaseModel, Field
from datetime import datetime


class ReportRequest(BaseModel):
    """Request payload for generating a forensic PDF report."""

    session_id: str = Field(..., description="Session to generate report for")
    subject_label: str | None = Field(None, description="Optional subject identifier")
    include_timeline: bool = Field(True, description="Include timeline analytics section")
    include_transcript: bool = Field(True, description="Include full transcript section")


class ReportResponse(BaseModel):
    """Response after report generation."""

    report_id: str = Field(..., description="Unique report UUID")
    session_id: str
    generated_at: datetime
    file_path: str = Field(..., description="Server-side path to the generated PDF")
    file_size_bytes: int | None = None
    download_url: str = Field(..., description="URL to download the report")
