"""
WebSocket endpoint for real-time 1Hz telemetry streaming with 10-second tumbling window synchronization.

Streams a combined multi-modal payload every second to connected clients.
Every 10-second boundary triggers segment-level evaluation latching and database synchronization.
"""
import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.shared.helpers import simulate_variance, clamp, score_to_verdict, latency_ms, format_timestamp, now_utc
from app.shared.logger import get_logger

router = APIRouter(tags=["WebSocket"])
logger = get_logger(__name__)

# Track latched scores per segment
_latched_scores = {
    "face_score": 88.0,
    "voice_score": 81.0,
    "text_score": 91.0,
    "evidence_score": 85.0,
    "fusion_score": 84.0,
    "confidence": 93.0,
}


def _make_telemetry_frame(tick: int) -> dict:
    """Generate a single 1Hz telemetry frame with 10-second tumbling window metadata."""
    segment_index = (tick // 10) + 1
    segment_elapsed_sec = (tick % 10) + 1  # 1 to 10
    is_boundary = (segment_elapsed_sec == 10)

    # If at boundary (second 10), compute the newly evaluated segment scores
    if is_boundary or tick == 0:
        face_score = clamp(simulate_variance(88.0, 3.5))
        voice_deception = clamp(simulate_variance(32.0, 4.0))
        voice_score = clamp(100.0 - voice_deception)
        text_score = clamp(simulate_variance(91.0, 3.0))
        evidence_score = clamp(simulate_variance(85.0, 2.5))

        truth_likelihood = clamp(
            face_score * 0.20 + voice_score * 0.24 + text_score * 0.28 + evidence_score * 0.18
            - (100.0 - voice_score) * 0.10
        )
        fusion_confidence = clamp(simulate_variance(93.0, 2.0))

        _latched_scores["face_score"] = round(face_score, 1)
        _latched_scores["voice_score"] = round(voice_score, 1)
        _latched_scores["text_score"] = round(text_score, 1)
        _latched_scores["evidence_score"] = round(evidence_score, 1)
        _latched_scores["fusion_score"] = round(truth_likelihood, 1)
        _latched_scores["confidence"] = round(fusion_confidence, 1)

    face_score = _latched_scores["face_score"]
    voice_score = _latched_scores["voice_score"]
    voice_deception = round(100.0 - voice_score, 1)
    text_score = _latched_scores["text_score"]
    evidence_score = _latched_scores["evidence_score"]
    truth_likelihood = _latched_scores["fusion_score"]
    fusion_confidence = _latched_scores["confidence"]

    return {
        "tick": tick,
        "timestamp": format_timestamp(now_utc()),
        "session_active": True,
        "segment_info": {
            "segment_index": segment_index,
            "segment_elapsed_sec": segment_elapsed_sec,
            "window_duration_sec": 10,
            "is_boundary": is_boundary,
        },
        "face": {
            "face_score": round(face_score, 1),
            "confidence": 92.0,
            "metrics": {
                "eye_contact_pct": round(clamp(simulate_variance(90.0, 3.0)), 1),
                "blink_rate_status": random.choice(["Normal", "Normal", "Normal", "Low"]),
                "head_stability_pct": round(clamp(simulate_variance(89.0, 2.0)), 1),
                "micro_expressions_level": random.choice(["Low", "Low", "Medium"]),
                "facial_tension_pct": round(clamp(simulate_variance(18.0, 2.0)), 1),
            },
            "key_reasons": [
                "Stable gaze maintained throughout segment",
                "Natural blinking frequency detected",
                "Consistent head orientation with minimal drift",
            ],
        },
        "voice": {
            "verdict": "Truthful" if voice_deception < 40 else "Uncertain",
            "deception_score": round(voice_deception, 1),
            "model_confidence": 84.0,
            "metrics": {
                "pitch_status": "Normal",
                "speech_rate_wpm": round(simulate_variance(142.0, 6.0), 1),
                "energy_pct": round(clamp(simulate_variance(72.0, 3.0)), 1),
                "hesitation_level": "Low",
                "pauses_count": 2,
                "stability_status": "Stable",
                "jitter_pct": 0.85,
                "shimmer_pct": 2.1,
            },
            "key_reasons": [
                "Steady fundamental frequency (F0)",
                "Minimal acoustic hesitation markers",
                "Natural pause durations between syntactic clauses",
            ],
            "observations": [
                "Stable pitch variation across phrases.",
                "Consistent vocal energy profile.",
            ],
        },
        "text": {
            "text_score": round(text_score, 1),
            "confidence": 91.0,
            "transcript": (
                "I arrived at the office around 10:15 AM. I had a meeting with the team and "
                "we discussed the new project requirements. After that, I worked on the "
                "proposal and submitted it by 2 PM."
            ),
            "highlighted_statements": [
                {"text": "10:15 AM", "status": "SUPPORTED", "evidence": "Calendar Event / Login Log"},
                {"text": "meeting", "status": "UNCERTAIN", "evidence": "No direct calendar invite found"},
                {"text": "new project requirements", "status": "SUPPORTED", "evidence": "Project Document matches"},
                {"text": "submitted it by 2 PM", "status": "SUPPORTED", "evidence": "Email Record 1:58 PM"},
            ],
            "fact_check_results": [
                {"source": "Calendar Event", "claim": "10:00 AM - 11:00 AM", "result": "SUPPORTED"},
                {"source": "Project Document", "claim": "Matches statement", "result": "SUPPORTED"},
                {"source": "Email Record", "claim": "Sent at 1:58 PM", "result": "SUPPORTED"},
                {"source": "System Log", "claim": "Login at 10:12 AM", "result": "SUPPORTED"},
            ],
            "key_reasons": [
                "High linguistic consistency across statements",
                "Low uncertainty phrasing / hedging words",
                "Clear syntactic structures",
            ],
        },
        "fusion": {
            "truth_likelihood_pct": round(truth_likelihood, 1),
            "fusion_confidence_pct": round(fusion_confidence, 1),
            "verdict": score_to_verdict(truth_likelihood),
            "explanation": (
                "Overall assessment indicates high consistency across facial, vocal, "
                "and linguistic indicators during the 10-second evaluation window."
            ),
            "contributors": {
                "linguistic_consistency": {"weight_pct": 28, "impact": "positive"},
                "speech_patterns": {"weight_pct": 24, "impact": "positive"},
                "facial_stability": {"weight_pct": 20, "impact": "positive"},
                "factual_evidence": {"weight_pct": 18, "impact": "positive"},
                "minor_hesitation": {"weight_pct": 6, "impact": "negative"},
            },
            "model_agreement": {
                "face_score": round(face_score, 1),
                "voice_score": round(voice_score, 1),
                "text_score": round(text_score, 1),
                "evidence_score": round(evidence_score, 1),
                "overall_agreement_pct": 96.0,
            },
            "system_status": {
                "uncertainty_level": "LOW",
                "video_quality": "Good",
                "audio_quality": "Good",
                "lighting": "Good",
                "background_noise": "Low",
                "processing_latency_ms": latency_ms(),
            },
        },
    }


@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket) -> None:
    """
    1Hz WebSocket telemetry stream with synchronized 10-second tumbling windows.
    """
    await websocket.accept()
    logger.info("WebSocket client connected")
    tick = 0
    try:
        while True:
            frame = _make_telemetry_frame(tick)
            await websocket.send_text(json.dumps(frame))
            tick += 1
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()
