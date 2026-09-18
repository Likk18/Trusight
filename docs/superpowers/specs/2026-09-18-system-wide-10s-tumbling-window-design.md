# System-Wide 10-Second Tumbling Window Synchronization Specification

**Date:** 2026-09-18  
**Topic:** End-to-End 10-Second Tumbling Window Evaluation Architecture Across All Modalities and Dashboard Components  
**Status:** Approved for Implementation

---

## 1. Executive Summary & Purpose

TruSight operates on a synchronized **10-Second Tumbling Window** architecture. In real-time multimodal deception analysis, single-second observations are too noisy to reliably evaluate acoustic jitter/shimmer, sustained facial tension, and linguistic claim validity. The 10-second tumbling window partitions live sessions into discrete, non-overlapping forensic epochs:
- **Segment 01:** `[00:00 – 00:10]`
- **Segment 02:** `[00:10 – 00:20]`
- **Segment 03:** `[00:20 – 00:30]`

Every subsystem—from backend ML inference and database persistence to WebSocket streaming and frontend gauge/chart rendering—synchronizes to this 10-second cadence.

---

## 2. Global Synchronization Model

```
 1Hz LIVE TICKS (Seconds 0 ➔ 9: Accumulation Phase)
 ┌────────────────────────────────────────────────────────┐
 │ • Real-time camera landmarks stream at 10 FPS          │
 │ • Web Audio analyser bounces equalizer bars (60 FPS)   │
 │ • 10s Segment Clock counts: 01s ➔ 02s ➔ ... ➔ 10s      │
 │ • Circular gauges hold validated prior segment scores  │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼ (Tick % 10 == 0)
 10-SECOND BOUNDARY (Evaluation & Latch Phase)
 ┌────────────────────────────────────────────────────────┐
 │ 1. Backend executes Tri-Modal Fusion Inference         │
 │ 2. Emits `SEGMENT_COMPLETE` WebSocket payload          │
 │ 3. Database writes `SessionSegment` record             │
 │ 4. Frontend gauges smoothly animate to new scores      │
 │ 5. Timeline charts append discrete 10s segment block   │
 │ 6. Window clock resets to 00s for next segment         │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Technical Specifications

### 3.1 Backend WebSocket & Telemetry Stream (`backend/app/api/websocket.py`)
- Pushes a structured 1Hz telemetry frame with embedded segment clock metadata:
  ```json
  {
    "tick": 20,
    "timestamp": "2026-09-18T07:55:20Z",
    "segment_info": {
      "segment_index": 2,
      "segment_elapsed_sec": 10,
      "is_boundary": true
    },
    "face": { "face_score": 84.5, ... },
    "voice": { "deception_score": 28.0, ... },
    "text": { "text_score": 89.0, ... },
    "fusion": { "truth_likelihood_pct": 82.0, "verdict": "LIKELY TRUTHFUL", ... }
  }
  ```
- At `tick % 10 == 0`, writes segment record to SQLite `SessionSegment` table.

### 3.2 Frontend State Management (`frontend/src/store/sessionStore.ts`)
- `segmentIndex: number` (e.g., 1, 2, 3...)
- `segmentElapsed: number` (0 to 10 seconds)
- `evaluatedSegments: SessionSegmentData[]`
- `ingestTelemetry`: Detects window boundaries and latches evaluated scores to circular gauges and time-series arrays.

### 3.3 Circular Gauges 10s Synchronization
- **`TruthAnalysisCard.tsx`:** 3 circular gauges (Facial Truth, Vocal Truth, Factual Truth) update smoothly upon 10-second completion.
- **`FusionScoreCard.tsx`:** Main circular gauge and Three.js `FloatingLines` shader update their scores and color states at each 10s boundary.

### 3.4 Dashboard Charts & Timelines 10s Synchronization
- **`TopFusionChart.tsx`:** Time axis calibrated in 10s epoch increments (`00:00`, `00:10`, `00:20`, `00:30`, `00:40`...).
- **`FacialSignalsCard.tsx`, `VocalSignalsCard.tsx`, `LinguisticSignalsCard.tsx`:** Multi-line signal histories synchronized to 10s tumbling windows.
- **`LiveTranscriptStrip.tsx` & `Header.tsx`:** Displays segment clock (`SEG 02 • 00:14`).

---

## 4. Verification & Validation Criteria

1. Backend WebSocket emits `segment_info` with accurate `segment_index` and `segment_elapsed_sec`.
2. Frontend gauges and charts update on 10s intervals with zero layout shifts.
3. `npm run build` passes with 0 TypeScript/Vite errors.
4. Backend test suite (`backend/test_face_integration.py`) passes 100%.
