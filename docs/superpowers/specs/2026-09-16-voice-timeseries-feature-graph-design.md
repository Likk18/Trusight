# Dynamic Acoustic Feature & Truthfulness Time-Series Graph Design

## 1. Objective
Replace the manual segment stepper in `VoicePanel.tsx` with a responsive, dynamic time-series graph tracking the correlation between acoustic cues (Hesitation Index, Vocal Energy %, Pitch Stability %) and Truthfulness Score over time.

## 2. Architecture & Data Model

### A. State Store (`frontend/src/store/sessionStore.ts`)
Add `voiceFeatureHistory`:
```typescript
export interface VoiceFeaturePoint {
  timestamp: string;
  truth: number;           // 0-100%
  hesitation: number;      // 0-100% (computed from hesitation level, pauses, jitter/shimmer)
  energy: number;          // 0-100% (RMS vocal energy)
  pitchStability: number;  // 0-100% (fundamental frequency consistency)
}
```
Accumulated on every 1Hz telemetry tick and also populated from uploaded audio analysis.

### B. UI Component (`frontend/src/components/voice/VoicePanel.tsx`)
- **Header:** Title, LIVE dot, Upload Audio button `[ 📁 Upload ]`, Reset to Live button `[ ↩ Live ]`. (Segment scrubber buttons removed).
- **Interactive Waveform:** Canvas audio visualizer with drag-and-drop file overlay.
- **Acoustic Time-Series Graph (Recharts):**
  - Multi-line chart with subtle glow:
    - Truthfulness: `#00d4ff` (Cyan)
    - Hesitation: `#f59e0b` (Amber)
    - Vocal Energy: `#8b5cf6` (Purple)
    - Pitch Stability: `#00ff88` (Emerald)
  - Interactive hover tooltip with formatted percentage values.
  - Reference threshold line at 70% (Truth threshold).
- **Telemetry Pills Matrix (6 metrics):** Pitch, Speech Rate (WPM), Energy, Hesitation, Pauses, Stability.
- **Score Ring & Confidence Bar:** Truth Likelihood gauge, Model Confidence meter, and Verdict badge.
- **Observations & Key Reasons:** Acoustic reasoning bullet points.

## 3. Implementation Steps
1. Extend `types/index.ts` with `VoiceFeaturePoint`.
2. Update `sessionStore.ts` to manage `voiceFeatureHistory`.
3. Implement `AcousticFeatureChart` inside `VoicePanel.tsx` using Recharts.
4. Verify TypeScript build and live streaming.
