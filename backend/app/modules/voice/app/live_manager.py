"""
live_manager.py

Browser-driven live recording session manager for TRUSIGHT.

Architecture change from v1
---------------------------
Previously the manager spawned a background thread that used sounddevice
(a Python PortAudio wrapper) to capture the SERVER's microphone. This is
wrong for a web application — the user's microphone is in their browser,
not on the server.

New flow (v2):
  1. Browser calls POST /live/start  → resets session state, marks running.
  2. Browser uses getUserMedia + MediaRecorder to record N-second segments.
  3. Browser calls POST /live/analyze with each completed audio blob.
  4. Backend decodes blob → existing ML pipeline → SegmentResult.
  5. Backend calls submit_segment() which stores the result AND broadcasts
     it to all connected WebSocket clients at /ws/live.
  6. Browser calls POST /live/stop when the user clicks Stop.

All WebSocket push, session history, and summary logic is preserved.
No sounddevice / PortAudio dependency remains in this module.

Thread-safety contract
----------------------
- _lock (threading.Lock) guards all mutable state reads/writes.
- WebSocket queues are per-connection asyncio.Queue objects; submit_segment()
  uses loop.call_soon_threadsafe so it is safe to call from any thread.
"""

from __future__ import annotations

import asyncio
import logging
import threading
import time
from typing import Dict, List, Optional

from .live_audio import VALID_WINDOWS, DEFAULT_WINDOW
from .live_analyzer import SegmentResult

logger = logging.getLogger("voice_service.live_manager")


class LiveSessionManager:
    """
    Singleton-style manager for a browser-driven live recording session.

    Only one session can run at a time. Calling start() while already running
    is a no-op (returns False). Call stop() explicitly before starting a new
    session with different parameters.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()

        # Session state (all guarded by _lock)
        self._running: bool = False
        self._window_seconds: int = DEFAULT_WINDOW
        self._segments: List[SegmentResult] = []
        self._session_start_time: float = 0.0
        self._current_status: str = "Stopped"  # "Listening" | "Processing" | "Stopped"

        # WebSocket subscriber queues  {client_id: asyncio.Queue}
        self._ws_queues: Dict[str, asyncio.Queue] = {}
        self._ws_loop: Optional[asyncio.AbstractEventLoop] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self, window_seconds: int = DEFAULT_WINDOW) -> bool:
        """
        Mark a new live session as started.

        The browser is responsible for capturing audio via getUserMedia and
        submitting each completed segment via POST /live/analyze.

        Parameters
        ----------
        window_seconds:
            Duration of each analysis window (must be in VALID_WINDOWS).
            Stored for reference; the browser enforces the actual timing.

        Returns
        -------
        bool
            True if the session was started; False if already running.

        Raises
        ------
        ValueError
            If window_seconds is not a valid choice.
        """
        if window_seconds not in VALID_WINDOWS:
            raise ValueError(
                f"Invalid window: {window_seconds}s. "
                f"Choose from {sorted(VALID_WINDOWS)}."
            )

        with self._lock:
            if self._running:
                logger.warning("start() called while session already running — ignored.")
                return False

            self._window_seconds = window_seconds
            self._segments = []
            self._session_start_time = time.monotonic()
            self._current_status = "Listening"
            self._running = True

        logger.info("Live session started (browser-driven, window=%ds).", window_seconds)
        return True

    def stop(self) -> None:
        """
        Mark the session as stopped and broadcast the final summary.

        Safe to call when not running (no-op).
        """
        with self._lock:
            if not self._running:
                return
            self._running = False
            self._current_status = "Stopped"

        logger.info("Live session stopped.")

        # Final broadcast so the frontend knows recording ended.
        self._broadcast(
            {
                "type": "session_stopped",
                "status": self.get_status(),
                "summary": self.get_session_summary(),
            }
        )

    def submit_segment(self, result: SegmentResult) -> None:
        """
        Accept a completed segment result (analysed by POST /live/analyze),
        store it, and broadcast it to all WebSocket clients.

        This is the primary way results enter the manager in browser-driven mode.
        Thread-safe: may be called from any thread or async context.
        """
        with self._lock:
            if not self._running:
                logger.warning("submit_segment() called when session is not running — ignoring.")
                return
            self._segments.append(result)
            self._current_status = "Listening"

        logger.info(
            "Segment %d stored: %s score=%.3f conf=%.3f",
            result.segment,
            result.verdict,
            result.score,
            result.confidence,
        )

        self._broadcast(
            {
                "type": "segment_result",
                "data": result.to_dict(),
                "status": self.get_status(),
            }
        )

    def get_next_segment_index(self) -> int:
        """Return the 1-based index for the next segment to be submitted."""
        with self._lock:
            return len(self._segments) + 1

    def get_session_start_time(self) -> float:
        """Return the monotonic clock time when this session started."""
        with self._lock:
            return self._session_start_time

    def get_status(self) -> dict:
        """
        Return a snapshot of the current session state.

        Returns dict matching GET /live/status response schema.
        """
        with self._lock:
            running = self._running
            window = self._window_seconds
            n_segments = len(self._segments)
            elapsed = time.monotonic() - self._session_start_time if running else 0.0
            status_str = self._current_status

        elapsed_label = _fmt_seconds(elapsed) if running else "00:00"
        return {
            "running": running,
            "window": window,
            "segments_processed": n_segments,
            "elapsed_time": elapsed_label,
            "current_status": status_str,
        }

    def get_results(self) -> List[dict]:
        """Return a JSON-serialisable list of all completed segment results."""
        with self._lock:
            return [seg.to_dict() for seg in self._segments]

    def get_session_summary(self) -> dict:
        """Generate a summary of the completed (or ongoing) session."""
        with self._lock:
            segments = list(self._segments)

        if not segments:
            return {
                "total_segments": 0,
                "total_time": "00:00",
                "avg_score": 0.0,
                "avg_confidence": 0.0,
                "highest_risk_segment": None,
                "lowest_risk_segment": None,
                "overall_verdict": "Insufficient data",
                "common_indicators": [],
            }

        speech_segments = [s for s in segments if s.verdict in ("Truthful", "Deceptive")]
        total_secs = segments[-1].end_seconds if segments else 0.0

        if not speech_segments:
            return {
                "total_segments": len(segments),
                "total_time": _fmt_seconds(total_secs),
                "avg_score": 0.0,
                "avg_confidence": 0.0,
                "highest_risk_segment": None,
                "lowest_risk_segment": None,
                "overall_verdict": "No Speech Detected" if segments else "Insufficient data",
                "common_indicators": ["No human vocal activity detected in session."],
            }

        scores = [s.score for s in speech_segments]
        confidences = [s.confidence for s in speech_segments]
        avg_score = sum(scores) / len(scores)
        avg_conf = sum(confidences) / len(confidences)

        hr_seg = max(speech_segments, key=lambda s: s.score)
        lr_seg = min(speech_segments, key=lambda s: s.score)

        # Aggregate explanation phrases
        indicator_counts: Dict[str, int] = {}
        for seg in speech_segments:
            for note in seg.explanation:
                indicator_counts[note] = indicator_counts.get(note, 0) + 1
        common = sorted(indicator_counts, key=lambda k: -indicator_counts[k])[:5]

        deceptive_count = sum(1 for s in speech_segments if s.verdict == "Deceptive")
        overall = "Deceptive" if deceptive_count > len(speech_segments) / 2 else "Truthful"

        return {
            "total_segments": len(segments),
            "total_time": _fmt_seconds(total_secs),
            "avg_score": round(avg_score, 4),
            "avg_confidence": round(avg_conf, 4),
            "highest_risk_segment": hr_seg.to_dict(),
            "lowest_risk_segment": lr_seg.to_dict(),
            "overall_verdict": overall,
            "common_indicators": common,
        }

    # ------------------------------------------------------------------
    # WebSocket subscriber management
    # ------------------------------------------------------------------

    def register_ws_client(
        self, client_id: str, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop
    ) -> None:
        """Register a new WebSocket client to receive live push updates."""
        with self._lock:
            self._ws_queues[client_id] = queue
            self._ws_loop = loop
        logger.debug("WS client registered: %s", client_id)

    def unregister_ws_client(self, client_id: str) -> None:
        """Remove a WebSocket client (called on disconnect)."""
        with self._lock:
            self._ws_queues.pop(client_id, None)
        logger.debug("WS client unregistered: %s", client_id)

    def _broadcast(self, payload: dict) -> None:
        """
        Push a payload dict to all connected WebSocket clients.

        Safe to call from any thread (uses call_soon_threadsafe).
        """
        with self._lock:
            queues = list(self._ws_queues.values())
            loop = self._ws_loop

        if not queues or loop is None:
            return

        for q in queues:
            try:
                loop.call_soon_threadsafe(q.put_nowait, payload)
            except Exception as exc:
                logger.debug("Failed to enqueue WS broadcast: %s", exc)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fmt_seconds(total: float) -> str:
    mins = int(total) // 60
    secs = int(total) % 60
    return f"{mins:02d}:{secs:02d}"
