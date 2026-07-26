"""
Fusion Engine — Weighted multi-modal truth synthesis.

This module ONLY reads normalized score values from the three AI modules.
It has NO knowledge of how those scores are internally computed.
Adding a new modality requires only updating the weights dict below.
"""
import math
from app.modules.fusion.schemas import (
    FusionRequest,
    FusionResponse,
    ContributorDetail,
    ModelAgreement,
    SystemStatus,
)
from app.shared.helpers import clamp, simulate_variance, score_to_verdict, latency_ms
from app.shared.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Weight Configuration — adjust to tune fusion sensitivity
# ---------------------------------------------------------------------------
CONTRIBUTOR_WEIGHTS = {
    "linguistic_consistency": 0.28,   # text module
    "speech_patterns":        0.24,   # voice module
    "facial_stability":       0.20,   # face module
    "factual_evidence":       0.18,   # text fact-check
    "minor_hesitation":       0.10,   # voice hesitation penalty (negative)
}


def _compute_agreement_pct(scores: list[float]) -> float:
    """Compute agreement as inverse of coefficient of variation, scaled to 0–100."""
    if not scores or len(scores) < 2:
        return 100.0
    mean = sum(scores) / len(scores)
    if mean == 0:
        return 0.0
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    cv = math.sqrt(variance) / mean  # coefficient of variation
    # Map CV to agreement: CV=0 → 100%, CV=0.5 → 0%
    agreement = clamp((1.0 - cv * 2.0) * 100.0)
    return round(agreement, 1)


def _uncertainty_level(confidence: float) -> str:
    if confidence >= 80:
        return "LOW"
    elif confidence >= 55:
        return "MEDIUM"
    return "HIGH"


def synthesize(request: FusionRequest) -> FusionResponse:
    """
    Pure fusion algorithm: consumes only normalized scores, produces final verdict.

    Isolation guarantee:
    - Does NOT import face, voice, or text service modules.
    - Does NOT access internal model state.
    - Reads ONLY the numeric scores from FusionRequest.
    """
    logger.info(f"[FUSION] Synthesizing for session {request.session_id}")

    # Derive voice truth score from deception score inversion
    # voice_score here represents 100 - deception_score (passed by the caller)
    face_score = request.face_score
    voice_truth_score = request.voice_score
    text_score = request.text_score

    # Simulated evidence score (derived from text confidence)
    evidence_score = clamp(simulate_variance(request.text_confidence, 3.0))

    # Weighted fusion calculation
    linguistic_contribution = text_score * CONTRIBUTOR_WEIGHTS["linguistic_consistency"]
    speech_contribution = voice_truth_score * CONTRIBUTOR_WEIGHTS["speech_patterns"]
    facial_contribution = face_score * CONTRIBUTOR_WEIGHTS["facial_stability"]
    evidence_contribution = evidence_score * CONTRIBUTOR_WEIGHTS["factual_evidence"]

    # Hesitation penalty: reduces score proportionally
    voice_hesitation_penalty = (100 - voice_truth_score) * CONTRIBUTOR_WEIGHTS["minor_hesitation"]

    raw_score = (
        linguistic_contribution
        + speech_contribution
        + facial_contribution
        + evidence_contribution
        - voice_hesitation_penalty
    ) / (sum(CONTRIBUTOR_WEIGHTS.values()) - CONTRIBUTOR_WEIGHTS["minor_hesitation"])

    truth_likelihood = clamp(raw_score)

    # Fusion confidence derived from individual model confidences
    avg_confidence = (request.face_confidence + request.voice_confidence + request.text_confidence) / 3
    fusion_confidence = clamp(simulate_variance(avg_confidence, 2.0))

    # Model agreement
    scores = [face_score, voice_truth_score, text_score, evidence_score]
    agreement_pct = _compute_agreement_pct(scores)

    # Build contributors map
    contributors = {
        "linguistic_consistency": ContributorDetail(
            weight_pct=round(CONTRIBUTOR_WEIGHTS["linguistic_consistency"] * 100),
            impact="positive",
        ),
        "speech_patterns": ContributorDetail(
            weight_pct=round(CONTRIBUTOR_WEIGHTS["speech_patterns"] * 100),
            impact="positive",
        ),
        "facial_stability": ContributorDetail(
            weight_pct=round(CONTRIBUTOR_WEIGHTS["facial_stability"] * 100),
            impact="positive",
        ),
        "factual_evidence": ContributorDetail(
            weight_pct=round(CONTRIBUTOR_WEIGHTS["factual_evidence"] * 100),
            impact="positive",
        ),
        "minor_hesitation": ContributorDetail(
            weight_pct=round(CONTRIBUTOR_WEIGHTS["minor_hesitation"] * 100),
            impact="negative",
        ),
    }

    verdict = score_to_verdict(truth_likelihood)
    uncertainty = _uncertainty_level(fusion_confidence)

    explanation = (
        "Overall assessment indicates high consistency across multiple behavioral "
        "and linguistic indicators. No strong signs of deception detected."
        if truth_likelihood >= 70
        else "Moderate inconsistencies detected across modalities. Further analysis recommended."
        if truth_likelihood >= 50
        else "Significant deceptive indicators identified across multiple modalities."
    )

    return FusionResponse(
        truth_likelihood_pct=round(truth_likelihood, 1),
        fusion_confidence_pct=round(fusion_confidence, 1),
        verdict=verdict,
        explanation=explanation,
        contributors=contributors,
        model_agreement=ModelAgreement(
            face_score=round(face_score, 1),
            voice_score=round(voice_truth_score, 1),
            text_score=round(text_score, 1),
            evidence_score=round(evidence_score, 1),
            overall_agreement_pct=agreement_pct,
        ),
        system_status=SystemStatus(
            uncertainty_level=uncertainty,
            video_quality="Good",
            audio_quality="Good",
            lighting="Good",
            background_noise="Low",
            processing_latency_ms=latency_ms(),
        ),
    )
