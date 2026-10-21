"""Pydantic schemas for the Case Analysis & Evidence Verification module."""
from pydantic import BaseModel, Field
from typing import Literal


class CaseUploadResponse(BaseModel):
    """Response after a Case PDF is uploaded, parsed, and indexed."""

    status: str = Field(default="success")
    case_id: str = Field(..., description="Unique case session identifier")
    filename: str = Field(..., description="Uploaded PDF file name")
    pages: int = Field(..., description="Total pages extracted from the PDF")
    chunks: int = Field(..., description="Total text chunks generated for RAG")
    message: str = Field(default="Case report loaded and indexed successfully.")


class EvidenceChunk(BaseModel):
    """A retrieved piece of evidence from the case report."""

    text: str = Field(..., description="Evidence excerpt text")
    page: int = Field(..., description="Source PDF page number (1-indexed)")
    distance: float = Field(..., description="FAISS L2 distance (lower indicates closer semantic match)")


class ConflictingElement(BaseModel):
    """A specific factual discrepancy detected between statement and evidence."""

    type: str = Field(..., description="Conflict type: time/date/location/person/action/object/quantity/detail")
    interview: str = Field(..., description="Claim made in the interview statement")
    evidence: str = Field(..., description="Factual record from the case evidence")
    page: int | None = Field(default=None, description="Source page number of conflicting evidence")


class ExplanationResult(BaseModel):
    """Evidence-grounded explanation produced by Ollama or validation fallback."""

    summary: str = Field(..., description="Summary explanation of the verdict")
    interview_statement: str = Field(default="")
    evidence_statement: str = Field(default="")
    conflicting_elements: list[ConflictingElement] = Field(default_factory=list)
    verdict: str = Field(..., description="NLI classification verdict")
    confidence: float = Field(..., description="Confidence percentage")
    conflict_validated: bool = Field(default=False, description="Whether an explicit factual conflict was verified")
    ollama_available: bool = Field(default=True, description="Whether Ollama was reachable")
    error: str | None = Field(default=None)


class StatementAnalysisResult(BaseModel):
    """Complete analysis result for an interview statement against case evidence."""

    status: str = Field(default="success")
    case_id: str
    transcript: str = Field(..., description="Transcribed or submitted interview statement")
    verdict: Literal["Entailment", "Neutral", "Contradiction", "No Statement", "No Evidence"]
    confidence: float = Field(..., ge=0, le=100)
    evidence: list[EvidenceChunk] = Field(default_factory=list)
    explanation: ExplanationResult
    conflict_validated: bool = Field(default=False)
    timestamp: str | None = Field(default=None)


class AnalyzeStatementRequest(BaseModel):
    """Request payload to analyze a direct text statement against a loaded case."""

    statement: str = Field(..., min_length=1, description="Interview statement to verify")
