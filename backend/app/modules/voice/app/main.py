"""
main.py

FastAPI entrypoint for the TRUSIGHT Voice Analysis service.

This module is intentionally thin: it wires together utils (I/O),
feature_extractor (acoustic features), predictor (ML inference), and
explanation (human-readable reasoning) behind two HTTP endpoints.

Run with:
    uvicorn app.main:app --reload
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .model import AnalyzeResponse, HealthResponse, ErrorResponse
from .utils import (
    load_audio_from_bytes,
    check_voice_presence,
    AudioValidationError,
    AudioProcessingError,
)
from .feature_extractor import FeatureExtractor, FeatureExtractionError
from .predictor import Predictor, ModelNotLoadedError
from .explanation import generate_explanations

# ── Live analysis imports ────────────────────────────────────────────────────
from .live_manager import LiveSessionManager
from .live_audio import VALID_WINDOWS, DEFAULT_WINDOW
from .live_analyzer import SegmentResult
from . import live_analyzer as _live_analyzer
import time as _time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("voice_service.main")

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

app = FastAPI(
    title="TRUSIGHT Voice Analysis Service",
    description=(
        "Standalone voice-analysis module for the TRUSIGHT multimodal truth "
        "verification system. Estimates deception likelihood from vocal "
        "acoustic cues only. This module does NOT make a final truth/lie "
        "decision on its own — see README for scope and limitations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Singletons, constructed once at import time (i.e. at process startup).
feature_extractor = FeatureExtractor()
predictor = Predictor()

# ── Live session manager singleton ───────────────────────────────────────────
live_manager = LiveSessionManager()

# Inject singletons into live_analyzer so it never re-loads models.
_live_analyzer.set_singletons(feature_extractor, predictor, generate_explanations)


_STATIC_DIR = Path(__file__).parent / "static"

# Mount static files directory (CSS/JS assets if added later)
if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


@app.on_event("startup")
def print_startup_banner():
    banner = (
        "\n"
        + "=" * 65 + "\n"
        + "  🚀 TRUSIGHT Voice Service is LIVE and READY!\n\n"
        + "  👉 OPEN IN BROWSER: http://localhost:8000\n"
        + "  👉 DIRECT IP LINK : http://127.0.0.1:8000\n"
        + "  👉 API DOCS       : http://localhost:8000/docs\n"
        + "=" * 65 + "\n"
    )
    print(banner, flush=True)


@app.get("/", include_in_schema=False)
def serve_ui():
    """Serve the TRUSIGHT web UI."""
    index = _STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return HealthResponse(service="Voice Analysis Service", status="running")


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    """Liveness check for load balancers."""
    return HealthResponse(service="Voice Analysis Service", status="running")


@app.post("/reload-model", tags=["admin"])
def reload_model() -> dict:
    """
    Hot-reload the model from disk without restarting the service.
    Useful after running train_model.py on a live instance.
    """
    predictor.reload()
    return {"model_loaded": predictor.is_ready()}


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or missing audio file"},
        422: {"model": ErrorResponse, "description": "Audio failed acoustic processing"},
        503: {"model": ErrorResponse, "description": "Model not loaded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
    tags=["analysis"],
)
async def analyze_audio(
    audio: UploadFile = File(..., description="Audio recording (wav/flac/ogg/mp3/m4a/mpeg/mpg)"),
    include_features: bool = Query(
        False, description="If true, include raw extracted acoustic features in the response."
    ),
) -> AnalyzeResponse:
    """
    Analyze an uploaded audio recording and return a deception-likelihood
    estimate based on vocal acoustic cues.

    This endpoint is one modality of the larger TRUSIGHT system and its
    output is not a standalone lie-detection verdict.
    """
    if audio is None:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    file_bytes = await audio.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    filename = audio.filename or "upload.wav"

    # --- Load & preprocess ---
    try:
        loaded_audio = load_audio_from_bytes(file_bytes, filename)
    except AudioValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AudioProcessingError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # --- Feature extraction ---
    try:
        if predictor.is_multimodal:
            # Upgraded pipeline: extract 814-dim (Acoustic + Wav2Vec2 + Verbal)
            from .deep_feature_extractor import extract_deep_features
            features_obj, _ = feature_extractor.extract(loaded_audio)
            vector = extract_deep_features(loaded_audio)
            features = features_obj
        else:
            # Legacy pipeline: extract 42-dim acoustic features only
            features, vector = feature_extractor.extract(loaded_audio)
    except FeatureExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # --- Check voice activity / speech presence ---
    has_speech, speech_note = check_voice_presence(loaded_audio, features)
    if not has_speech:
        return AnalyzeResponse(
            verdict="No Speech Detected",
            score=0.0,
            confidence=0.0,
            explanation=[
                "No human vocal activity detected in this recording.",
                "Signal level is consistent with ambient room silence or background noise.",
                "Please upload a recording containing clear spoken voice.",
            ],
            features=features if include_features else None,
        )

    # --- Prediction ---
    try:
        verdict, score, confidence = predictor.predict(vector)
    except ModelNotLoadedError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("Prediction failed unexpectedly")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    explanation = generate_explanations(features, score)

    return AnalyzeResponse(
        verdict=verdict,
        score=round(score, 4),
        confidence=round(confidence, 4),
        explanation=explanation,
        features=features if include_features else None,
    )


# ============================================================================
# Live Microphone Endpoints
# ============================================================================

class LiveStartRequest(BaseModel):
    """Request body for POST /live/start."""

    window_seconds: int = Field(
        DEFAULT_WINDOW,
        description=f"Recording window duration in seconds. Allowed: {sorted(VALID_WINDOWS)}.",
    )


@app.post("/live/start", tags=["live"])
def live_start(body: LiveStartRequest) -> dict:
    """
    Start continuous live microphone recording and analysis.

    Each completed recording window is automatically analysed and the
    result is broadcast to all connected WebSocket clients at /ws/live.

    Returns 409 if a session is already running.
    Returns 503 if the microphone or model is unavailable.
    """
    if not predictor.is_ready():
        raise HTTPException(
            status_code=503,
            detail=(
                "Deception model is not loaded. "
                "Run train_model.py to create app/models/deception_model.pkl, "
                "then POST /reload-model."
            ),
        )

    try:
        started = live_manager.start(window_seconds=body.window_seconds)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not started:
        raise HTTPException(
            status_code=409,
            detail="A live session is already running. POST /live/stop first.",
        )

    return {
        "message": "Live session started.",
        "window_seconds": body.window_seconds,
    }


@app.post("/live/stop", tags=["live"])
def live_stop() -> dict:
    """
    Stop the running live recording session gracefully.

    Waits for the current analysis window to complete before stopping.
    Safe to call even if no session is running.
    """
    live_manager.stop()
    summary = live_manager.get_session_summary()
    return {
        "message": "Live session stopped.",
        "summary": summary,
    }


@app.get("/live/status", tags=["live"])
def live_status() -> dict:
    """
    Get the current live session status.

    Returns running state, window size, segments processed,
    elapsed time, and human-readable status string.
    """
    return live_manager.get_status()


@app.get("/live/results", tags=["live"])
def live_results() -> list:
    """
    Get all analysis results from the current (or most recent) session.

    Results are appended as each window completes; they are never overwritten.
    """
    return live_manager.get_results()


@app.get("/live/summary", tags=["live"])
def live_summary() -> dict:
    """
    Get the aggregate summary for the current (or most recent) session.

    Includes average scores, highest/lowest risk segments, and common
    acoustic indicators.
    """
    return live_manager.get_session_summary()


@app.post(
    "/live/analyze",
    response_model=None,
    tags=["live"],
)
async def live_analyze_segment(
    audio: UploadFile = File(
        ...,
        description=(
            "A single audio segment recorded by the browser via MediaRecorder. "
            "Accepted formats: webm, wav, ogg, flac. "
            "The backend decodes and resamples to 16 kHz mono automatically."
        ),
    ),
) -> JSONResponse:
    """
    Analyse a single browser-recorded audio segment from the Live Microphone feature.

    This endpoint is the server-side counterpart of the browser's MediaRecorder.
    The browser captures each N-second window via getUserMedia, creates a Blob,
    and POSTs it here.  We run the SAME pipeline as POST /analyze:

        decode audio → extract features → run classifier → generate explanations

    The result is stored in the live session and broadcast via WebSocket so the
    frontend dashboard updates in real time.

    Returns the same fields as POST /analyze plus session-level metadata.
    """
    if not predictor.is_ready():
        raise HTTPException(
            status_code=503,
            detail=(
                "Deception model is not loaded. "
                "Run train_model.py to create app/models/deception_model.pkl, "
                "then POST /reload-model."
            ),
        )

    # ── Read uploaded audio blob ──────────────────────────────────────────
    file_bytes = await audio.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Audio segment is empty.")

    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Segment too large (>{MAX_UPLOAD_BYTES // (1024*1024)}MB).",
        )

    # Determine filename/extension from the upload.  MediaRecorder typically
    # sends 'audio/webm' or 'audio/ogg'; we map these to proper extensions.
    content_type = (audio.content_type or "").lower()
    original_name = audio.filename or "segment.webm"

    # Normalise the extension so load_audio_from_bytes can route correctly.
    if original_name.endswith(".webm") or "webm" in content_type:
        segment_filename = "live_segment.webm"
    elif original_name.endswith(".ogg") or "ogg" in content_type:
        segment_filename = "live_segment.ogg"
    elif original_name.endswith(".wav") or "wav" in content_type:
        segment_filename = "live_segment.wav"
    else:
        # Default to webm — the most common MediaRecorder output in Chrome.
        segment_filename = "live_segment.webm"

    logger.info(
        "[TRUSIGHT] Live segment received: %d bytes, content_type=%s → treating as %s",
        len(file_bytes), content_type, segment_filename,
    )

    # ── Decode & preprocess ───────────────────────────────────────────────
    try:
        loaded_audio = load_audio_from_bytes(file_bytes, segment_filename)
    except AudioValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AudioProcessingError as e:
        raise HTTPException(status_code=422, detail=str(e))

    logger.info(
        "[TRUSIGHT] Decoded segment: %.2fs @ %d Hz",
        loaded_audio.duration_seconds, loaded_audio.sample_rate,
    )

    # ── Feature extraction (same path as POST /analyze) ───────────────────
    try:
        if predictor.is_multimodal:
            from .deep_feature_extractor import extract_deep_features
            features_obj, _ = feature_extractor.extract(loaded_audio)
            vector = extract_deep_features(loaded_audio)
        else:
            features_obj, vector = feature_extractor.extract(loaded_audio)
    except FeatureExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Check voice activity / speech presence ───────────────────────────
    has_speech, speech_note = check_voice_presence(loaded_audio, features_obj)
    if not has_speech:
        logger.info("[TRUSIGHT] Live segment has no voice activity: %s", speech_note)
        verdict = "No Speech Detected"
        score = 0.0
        confidence = 0.0
        explanation = [
            "No human vocal activity detected in this recording window.",
            "Signal level is consistent with ambient room silence or background noise.",
            "Please speak clearly into your microphone to verify truthfulness.",
        ]
    else:
        # ── Prediction ────────────────────────────────────────────────────────
        try:
            verdict, score, confidence = predictor.predict(vector)
        except Exception as e:
            logger.exception("Live segment prediction failed")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

        explanation = generate_explanations(features_obj, score)

        logger.info(
            "[TRUSIGHT] Segment result: %s score=%.3f conf=%.3f",
            verdict, score, confidence,
        )

    # ── Store in session manager & broadcast via WebSocket ────────────────
    segment_index = live_manager.get_next_segment_index()
    start_seconds = _time.monotonic() - live_manager.get_session_start_time()
    # end_seconds is start + actual audio duration
    end_seconds = start_seconds + loaded_audio.duration_seconds

    seg_result = SegmentResult(
        segment=segment_index,
        start_seconds=max(0.0, start_seconds - loaded_audio.duration_seconds),
        end_seconds=end_seconds,
        verdict=verdict,
        score=round(score, 4),
        confidence=round(confidence, 4),
        explanation=explanation,
        features=features_obj,
    )

    # submit_segment() handles storage and WebSocket broadcast.
    # If no session is running the manager logs a warning and returns;
    # the HTTP response is still valid so the frontend can still display the result.
    live_manager.submit_segment(seg_result)

    return JSONResponse(content={
        "segment": segment_index,
        "verdict": verdict,
        "score": round(score, 4),
        "confidence": round(confidence, 4),
        "explanation": explanation,
        "duration": round(loaded_audio.duration_seconds, 2),
    })


# ============================================================================
# WebSocket endpoint — push updates to the frontend
# ============================================================================

@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket):
    """
    WebSocket endpoint for live analysis push updates.

    Connect before or after starting a session. Every time a recording
    window is analysed the server pushes a JSON message of the form:

        {"type": "segment_result", "data": {...}, "status": {...}}

    When the session stops:

        {"type": "session_stopped", "status": {...}, "summary": {...}}
    """
    await websocket.accept()
    client_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    live_manager.register_ws_client(client_id, queue, loop)
    logger.info("WebSocket client connected: %s", client_id)

    # Send current status immediately so the frontend can sync.
    try:
        await websocket.send_text(
            json.dumps({"type": "connected", "status": live_manager.get_status()})
        )
    except Exception:
        pass

    try:
        while True:
            # Wait for a message from the manager (segment result or stop signal).
            # Also handle incoming ping/pong from the client.
            try:
                payload = await asyncio.wait_for(queue.get(), timeout=5.0)
                await websocket.send_text(json.dumps(payload))
            except asyncio.TimeoutError:
                # Send a heartbeat ping so the browser keeps the connection alive.
                try:
                    await websocket.send_text(json.dumps({"type": "ping"}))
                except Exception:
                    break
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected: %s", client_id)
    except Exception as exc:
        logger.warning("WebSocket error for %s: %s", client_id, exc)
    finally:
        live_manager.unregister_ws_client(client_id)


# ============================================================================
# Global exception handler
# ============================================================================

@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Catch-all so unexpected errors return structured JSON, not a raw 500 HTML page."""
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})
