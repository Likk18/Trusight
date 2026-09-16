"""
model.py

Pydantic schemas for the Voice Analysis API. Kept separate from
predictor.py (the ML model wrapper) to avoid the naming clash between
"data model" and "ML model" causing confusion.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class VoiceFeatures(BaseModel):
    """
    All acoustic features extracted from a single audio sample.
    Returned internally to the predictor and exposed to the caller only
    when `include_features=true` is passed, to keep the default response
    payload small.
    """

    # --- Pitch (F0) ---
    pitch_mean: float = Field(..., description="Mean fundamental frequency (Hz)")
    pitch_std: float = Field(..., description="Standard deviation of F0 (Hz)")
    pitch_min: float = Field(..., description="Minimum voiced F0 (Hz)")
    pitch_max: float = Field(..., description="Maximum voiced F0 (Hz)")

    # --- Voice quality (Parselmouth) ---
    jitter_local: float = Field(..., description="Local jitter (cycle-to-cycle F0 perturbation)")
    shimmer_local: float = Field(..., description="Local shimmer (cycle-to-cycle amplitude perturbation)")

    # --- Timing / tempo ---
    speech_tempo: float = Field(..., description="Estimated tempo in beats/onsets per second")
    pause_ratio: float = Field(..., description="Fraction of total duration classified as silence/pause")
    pause_count: int = Field(..., description="Number of detected pause segments")
    silence_duration: float = Field(..., description="Total silent duration in seconds")

    # --- Energy ---
    rms_energy_mean: float = Field(..., description="Mean RMS energy")
    rms_energy_std: float = Field(..., description="Standard deviation of RMS energy")

    # --- Spectral ---
    zero_crossing_rate: float = Field(..., description="Mean zero crossing rate")
    spectral_centroid: float = Field(..., description="Mean spectral centroid (Hz)")
    spectral_bandwidth: float = Field(..., description="Mean spectral bandwidth (Hz)")
    spectral_rolloff: float = Field(..., description="Mean spectral roll-off (Hz)")

    # --- MFCCs (13 coefficients, mean over time) ---
    mfcc_mean: List[float] = Field(..., description="Mean of each of the 13 MFCC coefficients")
    mfcc_std: List[float] = Field(..., description="Std deviation of each of the 13 MFCC coefficients")

    class Config:
        json_schema_extra = {
            "example": {
                "pitch_mean": 178.4,
                "pitch_std": 24.1,
                "pitch_min": 110.2,
                "pitch_max": 260.7,
                "jitter_local": 0.012,
                "shimmer_local": 0.045,
                "speech_tempo": 2.3,
                "pause_ratio": 0.18,
                "pause_count": 4,
                "silence_duration": 1.6,
                "rms_energy_mean": 0.084,
                "rms_energy_std": 0.021,
                "zero_crossing_rate": 0.071,
                "spectral_centroid": 1820.5,
                "spectral_bandwidth": 1590.2,
                "spectral_rolloff": 3400.9,
                "mfcc_mean": [0.0] * 13,
                "mfcc_std": [0.0] * 13,
            }
        }


class AnalyzeResponse(BaseModel):
    """Response body for POST /analyze"""

    verdict: str = Field(..., description="'Truthful' or 'Deceptive'")
    score: float = Field(..., ge=0.0, le=1.0, description="Deception likelihood, 0=truthful, 1=deceptive")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence in the verdict")
    explanation: List[str] = Field(..., description="2-5 human-readable acoustic observations")
    features: Optional[VoiceFeatures] = Field(
        None, description="Raw extracted features (only present if include_features=true)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "verdict": "Truthful",
                "score": 0.34,
                "confidence": 0.66,
                "explanation": [
                    "Stable pitch variation",
                    "Normal speech tempo",
                    "Few hesitation pauses",
                ],
                "features": None,
            }
        }


class HealthResponse(BaseModel):
    service: str
    status: str


class ErrorResponse(BaseModel):
    detail: str
