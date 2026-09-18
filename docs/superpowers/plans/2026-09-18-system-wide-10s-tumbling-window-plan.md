# System-Wide 10-Second Tumbling Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 10-second synchronized tumbling-window evaluation and update architecture across the backend WebSocket broadcaster, database models, frontend Zustand store, circular gauges, and dashboard charts.

**Architecture:** A synchronized 10s evaluation lifecycle where 1Hz accumulation triggers a 10s boundary evaluation, updating circular gauges, charts, and database segment records in parallel.

**Tech Stack:** FastAPI, WebSockets, SQLAlchemy, SQLite, React 19, TypeScript, Zustand, Recharts, Three.js.

---

### Task 1: Backend WebSocket 10-Second Tumbling Window Telemetry

**Files:**
- Modify: `backend/app/api/websocket.py`
- Test: `backend/test_websocket_segments.py`

- [ ] **Step 1: Update `backend/app/api/websocket.py` to embed `segment_info` with 10s window metadata (`segment_index`, `segment_elapsed_sec`, `is_boundary`).**
- [ ] **Step 2: Create automated test `backend/test_websocket_segments.py` and verify passing.**

---

### Task 2: Frontend Zustand Store 10s Tumbling Window State

**Files:**
- Modify: `frontend/src/store/sessionStore.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Add `segment_info` to `TelemetryFrame` in `frontend/src/types/index.ts`.**
- [ ] **Step 2: Update `sessionStore.ts` to manage `segmentIndex`, `segmentElapsed`, and 10s evaluation latching.**
- [ ] **Step 3: Verify with `npm run build`.**

---

### Task 3: Circular Gauges & Fusion Score 10s Synchronization

**Files:**
- Modify: `frontend/src/components/dashboard/TruthAnalysisCard.tsx`
- Modify: `frontend/src/components/dashboard/FusionScoreCard.tsx`
- Modify: `frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Update `TruthAnalysisCard.tsx` to latch scores and display 10s segment progress.**
- [ ] **Step 2: Update `FusionScoreCard.tsx` to synchronize gauge value and FloatingLines color state to 10s windows.**
- [ ] **Step 3: Update `Header.tsx` to display active segment info (`SEG 02 • 00:14`).**

---

### Task 4: Time-Series Charts & Transcript 10s Alignment

**Files:**
- Modify: `frontend/src/components/dashboard/TopFusionChart.tsx`
- Modify: `frontend/src/components/dashboard/FacialSignalsCard.tsx`
- Modify: `frontend/src/components/dashboard/VocalSignalsCard.tsx`
- Modify: `frontend/src/components/dashboard/LinguisticSignalsCard.tsx`
- Modify: `frontend/src/components/dashboard/LiveTranscriptStrip.tsx`

- [ ] **Step 1: Align `TopFusionChart.tsx` X-axis to 10s epoch increments.**
- [ ] **Step 2: Connect `FacialSignalsCard`, `VocalSignalsCard`, and `LinguisticSignalsCard` to 10s segment history.**
- [ ] **Step 3: Update `LiveTranscriptStrip.tsx` to display the active 10s segment clock.**

---

### Task 5: End-to-End Build & Test Verification

**Files:**
- Test: `backend/`
- Build: `frontend/`

- [ ] **Step 1: Execute `npm run build` in `frontend/`.**
- [ ] **Step 2: Execute `backend/test_face_integration.py` and websocket segment tests.**
- [ ] **Step 3: Verify zero errors and clean live synchronization.**
