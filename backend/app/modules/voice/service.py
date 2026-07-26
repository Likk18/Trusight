"""
DUMMY Voice AI Service — for development and integration testing.

=============================================================
DEVELOPER 2 HANDOFF INSTRUCTIONS
=============================================================
Replace THIS FILE ONLY with your real voice analysis ML model.

Contract requirements:
  - Accept a `VoiceAnalysisRequest` object as input.
  - Return a `VoiceAnalysisResponse` object as output.
  - Do NOT modify schemas.py, router.py, or any other file.
  - CRITICAL: The key names in VoiceAnalysisResponse (verdict,
    deception_score, model_confidence, etc.) are FIXED by team
    agreement. Do NOT change them.
=============================================================
"""
import random
from app.modules.voice.schemas import (
    VoiceAnalysisRequest,
    VoiceAnalysisResponse,
    VoiceMetrics,
)
from app.shared.helpers import simulate_variance, clamp
from app.shared.logger import get_logger

logger = get_logger(__name__)

_BASE = {
    "deception_score": 34.0,
    "model_confidence": 81.0,
    "speech_rate_wpm": 142.0,
    "energy_pct": 72.0,
    "pauses_count": 3,
}

_PITCH_OPTIONS = ["Normal", "Normal", "Normal", "High", "Low"]
_HESITATION_OPTIONS = ["Low", "Low", "Low", "Medium", "High"]

_OBSERVATIONS_POOL = [
    "High pitch variability detected.",
    "Frequent hesitation pauses detected.",
    "Speech tempo faster than expected.",
    "Voice instability observed (elevated jitter).",
    "Amplitude instability observed (elevated shimmer).",
    "Natural prosodic contour maintained throughout.",
    "Consistent vowel formant frequencies detected.",
]

_KEY_REASONS_POOL = [
    "Steady fundamental frequency (F0)",
    "Minimal acoustic hesitation markers",
    "Natural pause durations between syntactic clauses",
    "Consistent vocal energy across response segments",
    "No significant shimmer or jitter anomalies",
    "Speech rate within natural conversational range",
]


async def analyze(request: VoiceAnalysisRequest) -> VoiceAnalysisResponse:
    """
    DUMMY implementation: returns simulated voice analysis with controlled variance.
    Replace this function body with real ML model inference for production.
    """
    logger.info(f"[DUMMY] Voice analysis for session {request.session_id}")

    deception_score = clamp(simulate_variance(_BASE["deception_score"], 5.0))
    model_confidence = clamp(simulate_variance(_BASE["model_confidence"], 3.0))

    # Verdict derived from deception score
    if deception_score < 40:
        verdict = "Truthful"
    elif deception_score < 65:
        verdict = "Uncertain"
    else:
        verdict = "Deceptive"

    metrics = VoiceMetrics(
        pitch_status=random.choices(_PITCH_OPTIONS, weights=[7, 7, 7, 1, 1])[0],
        speech_rate_wpm=round(simulate_variance(_BASE["speech_rate_wpm"], 10.0), 1),
        energy_pct=round(clamp(simulate_variance(_BASE["energy_pct"], 5.0)), 1),
        hesitation_level=random.choices(_HESITATION_OPTIONS, weights=[7, 7, 7, 2, 1])[0],
        pauses_count=max(0, int(simulate_variance(_BASE["pauses_count"], 1.5))),
    )

    observations = random.sample(_OBSERVATIONS_POOL, k=random.randint(3, 5))
    key_reasons = random.sample(_KEY_REASONS_POOL, k=3)

    return VoiceAnalysisResponse(
        verdict=verdict,
        deception_score=round(deception_score, 1),
        model_confidence=round(model_confidence, 1),
        metrics=metrics,
        observations=observations,
        key_reasons=key_reasons,
    )
