# Exact Reference Dashboard (`Dashboard_reference.png`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the exact design, cards, components, color scheme, typography, floating lines background, and 100vh zero-scroll layout from `frontend/src/assets/Dashboard_reference.png`.

**Architecture:** A 3-row, 10-card modular React+TypeScript dashboard with custom animated canvas `FloatingLines` (2 color variants for $\ge 50\%$ vs $< 50\%$) and live telemetry integration.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, Axios, WebSocket.

---

### File Structure Map
- `frontend/src/App.tsx`: Main zero-scroll 100vh grid layout container matching reference row hierarchy.
- `frontend/src/components/layout/Header.tsx`: Reference-matched header with status badges, session timer, and export button.
- `frontend/src/components/text/TranscriptPanel.tsx`: Row 1 Left (65%) claim verification cards and highlighted transcript.
- `frontend/src/components/dashboard/SystemStatus.tsx`: Row 1 Right (35%) evidence strength donut chart and system status indicators.
- `frontend/src/components/face/FacePanel.tsx`: Row 2 Left (30%) webcam feed with 478 MediaPipe landmarks, pose, gaze, AU bars, and score ring.
- `frontend/src/components/dashboard/OverallTruthLikelihood.tsx`: Row 2 Center (40%) Fusion Score card with Arc Gauge, 10s countdown pill, and `FloatingLines` background.
- `frontend/src/components/fusion/FloatingLines.tsx`: 2-state dynamic canvas animated flowing lines (Green harmonic / Red perturbation).
- `frontend/src/components/voice/VoicePanel.tsx`: Row 2 Right-Top (55%) acoustic telemetry, pitch stability, and upload zone.
- `frontend/src/components/dashboard/ModelAgreement.tsx`: Row 2 Right-Bottom (45%) Tri-Modal agreement bars and factor breakdown.
- `frontend/src/components/dashboard/FacialSignalsChart.tsx`: Row 3 Left (33.3%) Facial signals multi-area chart.
- `frontend/src/components/dashboard/VocalSignalsChart.tsx`: Row 3 Center (33.3%) Vocal signals multi-area chart.
- `frontend/src/components/dashboard/FusionScoreChart.tsx`: Row 3 Right (33.3%) Fusion score timeline area chart.

---

### Task 1: Fusion Score Floating Lines Background Component

**Files:**
- Create: `frontend/src/components/fusion/FloatingLines.tsx`
- Modify: `frontend/src/components/dashboard/OverallTruthLikelihood.tsx`

- [ ] **Step 1: Implement `FloatingLines.tsx` with dynamic dual-variant colors & oscillations**
  - Score $\ge 50\%$: Emerald/Cyan harmonic sine waves (`#00ff88` / `#00d4ff`).
  - Score $< 50\%$: Crimson/Orange tremor perturbation waves (`#ef4444` / `#f97316`).
- [ ] **Step 2: Embed `FloatingLines` in `OverallTruthLikelihood.tsx` behind the central Arc Gauge**
- [ ] **Step 3: Verify with `npm run build`**

---

### Task 2: Row 1 & Row 2 Dashboard Grid Layout Parity

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/text/TranscriptPanel.tsx`
- Modify: `frontend/src/components/dashboard/SystemStatus.tsx`
- Modify: `frontend/src/components/face/FacePanel.tsx`
- Modify: `frontend/src/components/voice/VoicePanel.tsx`
- Modify: `frontend/src/components/dashboard/ModelAgreement.tsx`

- [ ] **Step 1: Update `App.tsx` grid layout to mirror `Dashboard_reference.png` row order**
  - Row 1: Transcript Panel (65%) + System Status & Evidence Donut (35%).
  - Row 2: Face Panel (30%) + Fusion Score Card (40%) + Right Column (Voice Panel 55% / Model Agreement 45%).
  - Row 3: Facial Signals (33.3%) + Vocal Signals (33.3%) + Fusion Timeline (33.3%).
- [ ] **Step 2: Adjust internal card heights, paddings, and font sizes to eliminate all inner scroll overflows.**
- [ ] **Step 3: Verify with `npm run build`**

---

### Task 3: Bottom Analytics Area Charts Wiring & Styling

**Files:**
- Modify: `frontend/src/components/dashboard/FacialSignalsChart.tsx`
- Modify: `frontend/src/components/dashboard/VocalSignalsChart.tsx`
- Modify: `frontend/src/components/dashboard/FusionScoreChart.tsx`

- [ ] **Step 1: Align chart gradient definitions, color keys, and tooltips in `FacialSignalsChart.tsx`**
- [ ] **Step 2: Connect `VocalSignalsChart.tsx` to acoustic telemetry streams**
- [ ] **Step 3: Connect `FusionScoreChart.tsx` to 10-second synchronized `truthScoreHistory`**
- [ ] **Step 4: Verify with `npm run build`**

---

### Task 4: End-to-End Verification & Zero-Scroll Testing

**Files:**
- Test: `backend/test_face_integration.py`
- Build: `frontend/`

- [ ] **Step 1: Execute `npm run build` in `frontend/`**
- [ ] **Step 2: Verify zero console errors, zero layout shifts, and passing test suites.**
- [ ] **Step 3: Commit changes.**
