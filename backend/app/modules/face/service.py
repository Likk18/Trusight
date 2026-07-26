"""
DUMMY Face AI Service — for development and integration testing.

=============================================================
DEVELOPER 1 HANDOFF INSTRUCTIONS
=============================================================
Replace THIS FILE ONLY with your real face analysis ML model.

Contract requirements:
  - Accept a `FaceAnalysisRequest` object as input.
  - Return a `FaceAnalysisResponse` object as output.
  - Do NOT modify schemas.py, router.py, or any other file.

Example replacement pattern:
    async def analyze(request: FaceAnalysisRequest) -> FaceAnalysisResponse:
        # Load your model
        model = load_your_model()
        # Run inference
        result = model.predict(frame_data)
        # Map to FaceAnalysisData
        return FaceAnalysisResponse(
            status="success",
            data=FaceAnalysisData(
                face_score=result.score,
                confidence=result.confidence,
                metrics=FaceMetrics(...),
                key_reasons=[...]
            )
        )
=============================================================
"""
import random
from app.modules.face.schemas import (
    FaceAnalysisRequest,
    FaceAnalysisResponse,
    FaceAnalysisData,
    FaceMetrics,
)
from app.shared.helpers import simulate_variance, clamp
from app.shared.logger import get_logger

logger = get_logger(__name__)

# Baseline values for simulation (designed to produce "truthful" persona)
_BASE = {
    "face_score": 88.0,
    "confidence": 92.0,
    "eye_contact_pct": 92.0,
    "head_stability_pct": 89.0,
    "facial_tension_pct": 18.0,
}

_BLINK_RATE_OPTIONS = ["Normal", "Normal", "Normal", "Low", "High"]
_MICRO_EXPRESSION_OPTIONS = ["Low", "Low", "Low", "Medium", "High"]
_KEY_REASONS_POOL = [
    "Stable gaze maintained throughout response",
    "Natural blinking frequency detected",
    "Slight eyebrow raise during timestamp 01:12",
    "Consistent head orientation with minimal drift",
    "No significant micro-expression bursts detected",
    "Bilateral facial muscle symmetry within normal range",
    "Eye contact sustained above 85% threshold",
]


async def analyze(request: FaceAnalysisRequest) -> FaceAnalysisResponse:
    """
    DUMMY implementation: returns simulated face analysis with controlled variance.
    Replace this function body with real ML model inference for production.
    """
    logger.info(f"[DUMMY] Face analysis for session {request.session_id}")

    face_score = clamp(simulate_variance(_BASE["face_score"], 4.0))
    confidence = clamp(simulate_variance(_BASE["confidence"], 3.0))

    metrics = FaceMetrics(
        eye_contact_pct=clamp(simulate_variance(_BASE["eye_contact_pct"], 5.0)),
        blink_rate_status=random.choices(_BLINK_RATE_OPTIONS, weights=[6, 6, 6, 1, 1])[0],
        head_stability_pct=clamp(simulate_variance(_BASE["head_stability_pct"], 4.0)),
        micro_expressions_level=random.choices(_MICRO_EXPRESSION_OPTIONS, weights=[7, 7, 7, 2, 1])[0],
        facial_tension_pct=clamp(simulate_variance(_BASE["facial_tension_pct"], 3.0)),
    )

    # Sample 3 reasons from pool
    reasons = random.sample(_KEY_REASONS_POOL, k=3)

    return FaceAnalysisResponse(
        status="success",
        data=FaceAnalysisData(
            face_score=round(face_score, 1),
            confidence=round(confidence, 1),
            metrics=metrics,
            key_reasons=reasons,
        ),
    )
