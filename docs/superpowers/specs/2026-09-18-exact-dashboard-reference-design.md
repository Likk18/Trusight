# Exact Reference Dashboard Design Specification (`Dashboard_reference.png`)

**Date:** 2026-09-18  
**Reference Source:** `D:\Projects\Trusight\frontend\src\assets\Dashboard_reference.png` (1672x941 @ 16:9)  
**Status:** Approved for Implementation

---

## 1. Overview & Screen Real Estate

The objective is to achieve **100% pixel, layout, component, and telemetry parity** with `Dashboard_reference.png`. The dashboard runs in a locked `100vh / 100vw` zero-scroll container with 3 distinct content rows and a global header.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (Height: 52px): TRUSIGHT Logo | Session # | Status Pills | Start / Stop Cam | Export Report     │
├───────────────────────────────────────────────────────────────────┬────────────────────────────────────┤
│ ROW 1 (Height: ~19% vh):                                          │                                    │
│ [Card 1] Live Transcript & Statement Verification (65% width)      │ [Card 2] Evidence & KPIs (35%)     │
├─────────────────────────┬─────────────────────────────────────────┼────────────────────────────────────┤
│ ROW 2 (Height: ~45% vh):│ [Card 4] Fusion Score                   │ [Card 5] Vocal Analysis (Top 55%)  │
│ [Card 3] Face Analysis  │   - Arc Gauge (0-100%)                  ├────────────────────────────────────┤
│   - Live 478-Mesh CV    │   - Floating Lines (Green/Red Variants) │ [Card 6] Model Agreement (Bot 45%) │
│   - Score Ring & Metrics│   - 10s Tumbling Window Countdown Badge │   - Face / Voice / Text Consensus  │
├─────────────────────────┴─────────────────────────────────────────┴────────────────────────────────────┤
│ ROW 3 (Height: ~28% vh): 3 Equal Multi-Series Analytics Charts                                         │
│ [Card 7] Facial Signals Chart    │ [Card 8] Vocal Signals Chart    │ [Card 9] Fusion Score Timeline    │
│ (Micro-expr, Gaze, Head, Blink) │ (Pitch, Cadence, Energy, Stabi) │ (Truth Likelihood over 10s blocks)│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Card-by-Card Component & Visual Specifications

### 2.1 Top Header Bar
- **Logo:** `TRUSIGHT` in `Space Grotesk` (800 weight, `#F8FAFC`) with glowing neon icon.
- **Center Session Pill:** `#a8f192b` | `● LIVE RECORDING` | `10s SYNC: 08s`.
- **Hardware Telemetry:** `CAM: ACTIVE`, `MIC: ACTIVE`, `WS: CONNECTED`.
- **Actions:** Green gradient `Start Session` / `Stop Session` button + Cyan outline `Export PDF` button.

### 2.2 Row 1 (Top Forensic Review Row)
- **Card 1 — Live Transcript & Claim Verification (Width: 65%):**
  - Text: Real-time recognized speech transcript with highlighted claim chips.
  - Status Indicators: `SUPPORTED` (emerald), `UNCERTAIN` (amber), `CONTRADICTED` (red).
  - Fact Check Evidence table linking statement claims to source verification logs.
- **Card 2 — Evidence Strength & System Status (Width: 35%):**
  - Donut Chart: Evidence Strength breakdown (70% Strong, 20% Moderate, 10% Weak).
  - System KPIs: Video Quality (Good), Audio Quality (Good), Lighting (Good), Background Noise (Low), Latency (120ms).

### 2.3 Row 2 (Primary Tri-Modal Live Analysis Row)
- **Card 3 — Face Analysis & Computer Vision (Width: 30%):**
  - Container with live webcam feed and direct 1:1 OpenCV visualizer overlay:
    - 478 MediaPipe FaceMesh points in bright cyan (`#00e6ff`).
    - Colored region overlays (forehead, nose, cheeks).
    - 3D Head Pose orientation axes (RGB arrows at nose tip).
    - Iris Gaze cyan direction rays from pupils.
    - AU intensity bars (AU01, AU02, AU04, AU12, AU14, AU45).
  - Score Ring: Face score (0-100) + label (Good / Moderate / High Risk).
  - Metrics Grid: Eye Contact %, Blink Rate, Head Stability %, Micro Expressions, Facial Tension %.
- **Card 4 — Fusion Score & Overall Truth Likelihood (Width: 40%):**
  - **Floating Lines Background Component:** Rendered exclusively behind the central gauge.
    - *Variant Green ($\ge 50\%$):* Harmonic emerald/cyan sine waves (`#00ff88` / `#00d4ff`).
    - *Variant Red ($< 50\%$):* Jagged crimson/orange perturbation tremor waves (`#ef4444` / `#f97316`).
  - Top-right corner: 10s Tumbling Window Countdown pill (`10s: Xs`) + Verdict badge (`LIKELY TRUTHFUL` / `DECEPTIVE`).
  - Center: Glowing Arc Gauge + big percentage text (`84%`) + `CONFIDENCE 93%`.
- **Card 5 — Vocal Dynamics Analysis (Width: 30%, Height: 55% of Row 2):**
  - Audio waveform visualizer / frequency spectrum bar.
  - Acoustic telemetry matrix: F0 pitch variation, Speech cadence (WPM), RMS Energy %, Hesitation level, Jitter %, Shimmer %.
  - Quick audio file upload dropzone.
- **Card 6 — Tri-Modal Model Agreement (Width: 30%, Height: 45% of Row 2):**
  - Consensus meter: Face (88%), Voice (81%), Text (91%), Evidence (85%).
  - Overall agreement percentage (`96%`) and contributing factor bars.

### 2.4 Row 3 (Bottom Analytics Area Charts Row)
- **Card 7 — Facial Signals Chart (Width: 33.3%):**
  - Multi-series Area chart: Micro-expressions (`#8B5CF6`), Gaze Deviation (`#F97316`), Head Movement (`#06FCD7`), Eye Blink Rate (`#EC4899`).
- **Card 8 — Vocal Signals Chart (Width: 33.3%):**
  - Multi-series Area chart: Pitch Variation (`#10B981`), Speech Rate (`#F59E0B`), Vocal Fillers (`#EF4444`), Voice Stability (`#8B5CF6`).
- **Card 9 — Fusion Score Timeline (Width: 33.3%):**
  - Area chart: Real-time 10-second synchronized tumbling-window truth likelihood curve (`#00D4FF` & `#00FF88`).

---

## 3. Visual Styling & Design Tokens

- **Background:** Void dark `#010d16` and card surface `#001422`.
- **Borders:** `1px solid rgba(0, 212, 255, 0.2)`.
- **Shadows:** `0 4px 20px rgba(0, 0, 0, 0.45)`.
- **Border Radius:** `8px` across all cards.
- **Typography:**
  - Headers & Labels: `Space Grotesk`, sans-serif (800 & 700 weight).
  - Numbers & Telemetry: `JetBrains Mono`, monospace.
  - Body Text: `Inter`, sans-serif.
- **Viewport Constraints:** Fixed `height: 100vh; overflow: hidden;` with zero page scrollbars.
