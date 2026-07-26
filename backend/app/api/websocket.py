"""
WebSocket endpoint for real-time 1Hz telemetry streaming.

Streams a combined simulation payload every second to connected clients.
The frontend Zustand store consumes this to update all dashboard panels
without polling individual REST endpoints.
"""
import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.shared.helpers import simulate_variance, clamp, score_to_verdict, latency_ms, format_timestamp, now_utc
from app.shared.logger import get_logger

router = APIRouter(tags=["WebSocket"])
logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Simulation state (resets per connection)
# ---------------------------------------------------------------------------

def _make_telemetry_frame(tick: int) -> dict:
    """Generate a single 1Hz telemetry frame with realistic simulation values."""
    face_score = clamp(simulate_variance(88.0, 3.5))
    voice_deception = clamp(simulate_variance(34.0, 4.0))
    voice_score = clamp(100 - voice_deception)
    text_score = clamp(simulate_variance(91.0, 3.0))
    evidence_score = clamp(simulate_variance(85.0, 2.5))

    # Fusion
    truth_likelihood = clamp(
        face_score * 0.20 + voice_score * 0.24 + text_score * 0.28 + evidence_score * 0.18
        - (100 - voice_score) * 0.10
    )
    fusion_confidence = clamp(simulate_variance(93.0, 2.0))

    return {
        "tick": tick,
        "timestamp": format_timestamp(now_utc()),
        "session_active": True,
        "face": {
            "face_score": round(face_score, 1),
            "confidence": round(clamp(simulate_variance(92.0, 2.0)), 1),
            "metrics": {
                "eye_contact_pct": round(clamp(simulate_variance(92.0, 4.0)), 1),
                "blink_rate_status": random.choice(["Normal", "Normal", "Normal", "Low"]),
                "head_stability_pct": round(clamp(simulate_variance(89.0, 3.0)), 1),
                "micro_expressions_level": random.choice(["Low", "Low", "Medium"]),
                "facial_tension_pct": round(clamp(simulate_variance(18.0, 2.0)), 1),
            },
            "key_reasons": [
                "Stable gaze maintained",
                "Natural blinking detected",
                "Consistent head orientation",
            ],
        },
        "voice": {
            "verdict": "Truthful" if voice_deception < 40 else "Uncertain",
            "deception_score": round(voice_deception, 1),
            "model_confidence": round(clamp(simulate_variance(81.0, 2.5)), 1),
            "metrics": {
                "pitch_status": random.choice(["Normal", "Normal", "High"]),
                "speech_rate_wpm": round(simulate_variance(142.0, 8.0), 1),
                "energy_pct": round(clamp(simulate_variance(72.0, 4.0)), 1),
                "hesitation_level": random.choice(["Low", "Low", "Medium"]),
                "pauses_count": max(0, int(simulate_variance(3, 1.0))),
            },
            "key_reasons": [
                "Steady F0 frequency",
                "Minimal hesitation markers",
                "Natural pause durations",
            ],
            "observations": [
                "Natural prosodic contour maintained.",
                "Consistent vowel formant frequencies.",
            ],
        },
        "text": {
            "text_score": round(text_score, 1),
            "confidence": round(clamp(simulate_variance(89.0, 2.5)), 1),
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
                "High linguistic consistency",
                "Low uncertainty phrasing",
                "Clear syntactic structures",
            ],
        },
        "fusion": {
            "truth_likelihood_pct": round(truth_likelihood, 1),
            "fusion_confidence_pct": round(fusion_confidence, 1),
            "verdict": score_to_verdict(truth_likelihood),
            "explanation": (
                "Overall assessment indicates high consistency across multiple behavioral "
                "and linguistic indicators. No strong signs of deception detected."
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
                "overall_agreement_pct": round(clamp(simulate_variance(96.0, 1.5)), 1),
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
    1Hz WebSocket telemetry stream.
    Pushes a complete multi-modal telemetry frame every second.
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
